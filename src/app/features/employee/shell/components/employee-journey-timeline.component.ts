import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { EmployeeJourneyErrorCode } from '../../data-access/employee-journey.store';
import { employeeTexts } from '../../employee.texts';
import {
  EmployeeJourneyEventModel,
  EmployeeJourneyEventStatus,
  EmployeeJourneyModel,
} from '../../models/employee-journey.model';

interface JourneyDetailEntryViewModel {
  id: string;
  text: string;
}

interface GroupedJourneySecondaryEventViewModel {
  id: string;
  summary: string;
}

interface GroupedJourneyEventViewModel {
  eventDate: string;
  primaryEvent: EmployeeJourneyEventModel;
  primaryDetails: ReadonlyArray<JourneyDetailEntryViewModel>;
  secondaryEvents: ReadonlyArray<GroupedJourneySecondaryEventViewModel>;
  hasCurrentEvent: boolean;
  hasFutureEvent: boolean;
}

const trackPriorityByCode: Readonly<Record<string, number>> = {
  PRESENCE: 0,
  CONTRACT: 1,
  LABOR_CLASSIFICATION: 2,
};

const secondaryTrackLabelByCode: Readonly<Record<string, string>> = {
  PRESENCE: 'Presencia',
  CONTRACT: 'Contrato',
  LABOR_CLASSIFICATION: 'Clasificacion',
};

@Component({
  selector: 'app-employee-journey-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-journey-timeline.component.html',
  styleUrl: './employee-journey-timeline.component.scss',
})
export class EmployeeJourneyTimelineComponent {
  readonly journey = input<EmployeeJourneyModel | null>(null);
  readonly loading = input(false);
  readonly error = input<EmployeeJourneyErrorCode | null>(null);
  protected readonly isExpanded = signal(false);

  protected readonly texts = employeeTexts;
  protected readonly groupedTimelineEvents = computed<ReadonlyArray<GroupedJourneyEventViewModel>>(() =>
    this.groupEventsByDate(this.journey()?.events ?? []),
  );
  protected readonly collapsedSummary = computed(() => {
    if (this.loading()) {
      return this.texts.timelineLoadingMessage;
    }

    if (this.error()) {
      return this.texts.timelineLoadFailedMessage;
    }

    const totalEvents = this.journey()?.events.length ?? 0;
    if (totalEvents === 0) {
      return this.texts.timelineNoEventsMessage;
    }

    const groupedEvents = this.groupedTimelineEvents();
    const latestGroupedEvent = groupedEvents[groupedEvents.length - 1];
    const eventsLabel =
      totalEvents === 1 ? this.texts.timelineEventsSingularLabel : this.texts.timelineEventsPluralLabel;

    if (!latestGroupedEvent) {
      return `${totalEvents} ${eventsLabel}`;
    }

    return `${totalEvents} ${eventsLabel} · ${this.texts.timelineLastEventLabel}: ${latestGroupedEvent.primaryEvent.title} (${latestGroupedEvent.eventDate})`;
  });
  protected readonly toggleAriaLabel = computed(() =>
    this.isExpanded() ? this.texts.timelineCollapseActionLabel : this.texts.timelineExpandActionLabel,
  );
  protected readonly hasEvents = computed(() => this.groupedTimelineEvents().length > 0);

  protected toggle(): void {
    this.isExpanded.update((value) => !value);
  }

  protected resolveStatusLabel(status: EmployeeJourneyEventStatus): string {
    if (status === 'current') {
      return this.texts.timelineStatusCurrentLabel;
    }

    if (status === 'future') {
      return this.texts.timelineStatusFutureLabel;
    }

    return this.texts.timelineStatusCompletedLabel;
  }

  protected trackGroupedEventBy(index: number, groupedEvent: GroupedJourneyEventViewModel): string {
    const primaryEvent = groupedEvent.primaryEvent;
    return `${groupedEvent.eventDate}-${index}-${primaryEvent.eventType}-${primaryEvent.title}`;
  }

  private groupEventsByDate(
    events: ReadonlyArray<EmployeeJourneyEventModel>,
  ): ReadonlyArray<GroupedJourneyEventViewModel> {
    const groupedEvents = new Map<string, Array<EmployeeJourneyEventModel>>();

    for (const event of events) {
      const eventsByDate = groupedEvents.get(event.eventDate);
      if (eventsByDate) {
        eventsByDate.push(event);
        continue;
      }

      groupedEvents.set(event.eventDate, [event]);
    }

    return Array.from(groupedEvents.entries()).map(([eventDate, dayEvents]) => {
      const primaryEventIndex = this.selectPrimaryEventIndex(dayEvents);
      const primaryEvent = dayEvents[primaryEventIndex];

      return {
        eventDate,
        primaryEvent,
        primaryDetails: this.toCompactDetails(primaryEvent),
        secondaryEvents: dayEvents
          .filter((_, index) => index !== primaryEventIndex)
          .map((event, index) => this.toSecondaryEvent(event, eventDate, index)),
        hasCurrentEvent: dayEvents.some((event) => event.isCurrent || event.status === 'current'),
        hasFutureEvent: dayEvents.some((event) => event.status === 'future'),
      };
    });
  }

  private selectPrimaryEventIndex(events: ReadonlyArray<EmployeeJourneyEventModel>): number {
    let selectedIndex = 0;
    let selectedPriority = this.toTrackPriority(events[0].trackCode);

    for (let index = 1; index < events.length; index += 1) {
      const eventPriority = this.toTrackPriority(events[index].trackCode);
      if (eventPriority < selectedPriority) {
        selectedPriority = eventPriority;
        selectedIndex = index;
      }
    }

    return selectedIndex;
  }

  private toTrackPriority(trackCode: string): number {
    const normalizedTrackCode = trackCode.trim().toUpperCase();
    return trackPriorityByCode[normalizedTrackCode] ?? Number.MAX_SAFE_INTEGER;
  }

  private toSecondaryEvent(
    event: EmployeeJourneyEventModel,
    eventDate: string,
    index: number,
  ): GroupedJourneySecondaryEventViewModel {
    return {
      id: `${eventDate}-${index}-${event.eventType}-${event.title}`,
      summary: this.toSecondarySummary(event),
    };
  }

  private toCompactDetails(event: EmployeeJourneyEventModel): ReadonlyArray<JourneyDetailEntryViewModel> {
    if (!this.isPresenceTrack(event.trackCode)) {
      return [];
    }

    const summary = this.toPresenceContextSummary(event.details, event.subtitle);
    if (!summary) {
      return [];
    }

    return [
      {
        id: `${event.eventDate}-${event.eventType}-presence-context`,
        text: summary,
      },
    ];
  }

  private toSecondarySummary(event: EmployeeJourneyEventModel): string {
    const trackLabel = this.toSecondaryTrackLabel(event.trackCode);
    const value = this.toSecondaryTrackValue(event);

    if (!value) {
      return trackLabel;
    }

    return `${trackLabel}: ${value}`;
  }

  private toSecondaryTrackValue(event: EmployeeJourneyEventModel): string | null {
    const normalizedSubtitle = this.normalizeNarrativeValue(event.subtitle);
    if (normalizedSubtitle) {
      return normalizedSubtitle;
    }

    const details = event.details;
    if (!details) {
      return null;
    }

    if (this.isContractTrack(event.trackCode)) {
      return this.toPairedSummary(details, 'contractCode', 'contractSubtypeCode');
    }

    if (this.isLaborClassificationTrack(event.trackCode)) {
      return this.toPairedSummary(details, 'agreementCode', 'agreementCategoryCode');
    }

    if (this.isPresenceTrack(event.trackCode)) {
      return this.toPresenceContextSummary(details, null);
    }

    return null;
  }

  private toSecondaryTrackLabel(trackCode: string): string {
    const normalizedTrackCode = trackCode.trim().toUpperCase();
    return secondaryTrackLabelByCode[normalizedTrackCode] ?? 'Evento';
  }

  private toPresenceContextSummary(
    details: Readonly<Record<string, unknown>> | null,
    fallbackSubtitle: string | null,
  ): string | null {
    if (!details) {
      return this.normalizeNarrativeValue(fallbackSubtitle);
    }

    const companyCode = this.toDisplayableValue(details['companyCode']);
    const presenceNumber = this.toDisplayableValue(details['presenceNumber']);

    if (companyCode && presenceNumber) {
      return `${companyCode} · periodo #${presenceNumber}`;
    }

    if (companyCode) {
      return companyCode;
    }

    if (presenceNumber) {
      return `periodo #${presenceNumber}`;
    }

    return this.normalizeNarrativeValue(fallbackSubtitle);
  }

  private toPairedSummary(
    details: Readonly<Record<string, unknown>>,
    firstKey: string,
    secondKey: string,
  ): string | null {
    const firstValue = this.toDisplayableValue(details[firstKey]);
    const secondValue = this.toDisplayableValue(details[secondKey]);

    if (firstValue && secondValue) {
      return `${firstValue} / ${secondValue}`;
    }

    return firstValue ?? secondValue;
  }

  private normalizeNarrativeValue(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    if (!normalizedValue) {
      return null;
    }

    return normalizedValue.replace(/\bperiod\s*#/gi, 'periodo #');
  }

  private isPresenceTrack(trackCode: string): boolean {
    return trackCode.trim().toUpperCase() === 'PRESENCE';
  }

  private isContractTrack(trackCode: string): boolean {
    return trackCode.trim().toUpperCase() === 'CONTRACT';
  }

  private isLaborClassificationTrack(trackCode: string): boolean {
    return trackCode.trim().toUpperCase() === 'LABOR_CLASSIFICATION';
  }

  private toDisplayableValue(value: unknown): string | null {
    if (typeof value === 'string') {
      const normalizedValue = value.trim();
      return normalizedValue.length > 0 ? normalizedValue : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return null;
  }
}