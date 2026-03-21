import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { EmployeeJourneyErrorCode } from '../../data-access/employee-journey.store';
import { employeeTexts } from '../../employee.texts';
import {
  EmployeeJourneyEventModel,
  EmployeeJourneyEventStatus,
  EmployeeJourneyModel,
} from '../../models/employee-journey.model';

interface JourneyDetailEntryViewModel {
  key: string;
  value: string;
}

interface GroupedJourneySecondaryEventViewModel {
  id: string;
  title: string;
  subtitle: string | null;
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

  protected readonly texts = employeeTexts;
  protected readonly groupedTimelineEvents = computed<ReadonlyArray<GroupedJourneyEventViewModel>>(() =>
    this.groupEventsByDate(this.journey()?.events ?? []),
  );
  protected readonly hasEvents = computed(() => this.groupedTimelineEvents().length > 0);
  protected readonly journeyEmployeeLabel = computed(() => {
    const employee = this.journey()?.employee;
    if (!employee) {
      return null;
    }

    if (employee.displayName) {
      return employee.displayName;
    }

    return `${employee.ruleSystemCode} / ${employee.employeeTypeCode} / ${employee.employeeNumber}`;
  });

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
      title: event.title,
      subtitle: event.subtitle,
    };
  }

  private toCompactDetails(event: EmployeeJourneyEventModel): ReadonlyArray<JourneyDetailEntryViewModel> {
    if (!event.details) {
      return [];
    }

    return Object.entries(event.details)
      .filter(([key]) => !this.isLowValueDetailKey(key))
      .map(([key, value]) => this.toDetailEntry(key, value))
      .filter((entry): entry is JourneyDetailEntryViewModel => entry !== null)
      .slice(0, 2);
  }

  private isLowValueDetailKey(value: string): boolean {
    const normalizedValue = value.trim().toLowerCase();
    return (
      normalizedValue === 'eventdate' ||
      normalizedValue === 'eventtype' ||
      normalizedValue === 'trackcode' ||
      normalizedValue === 'title' ||
      normalizedValue === 'subtitle' ||
      normalizedValue === 'status' ||
      normalizedValue === 'iscurrent'
    );
  }

  private toDetailEntry(key: string, value: unknown): JourneyDetailEntryViewModel | null {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      return null;
    }

    const displayValue = this.toDisplayableValue(value);
    if (!displayValue) {
      return null;
    }

    return {
      key: this.toDisplayableKey(normalizedKey),
      value: displayValue,
    };
  }

  private toDisplayableKey(value: string): string {
    const normalizedValue = value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .trim();

    if (!normalizedValue) {
      return value;
    }

    return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
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