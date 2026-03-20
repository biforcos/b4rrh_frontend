import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { EmployeeJourneyErrorCode } from '../../data-access/employee-journey.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeJourneyModel, EmployeeJourneyTrackItemModel } from '../../models/employee-journey.model';

interface JourneyDetailEntryViewModel {
  key: string;
  value: string;
}

interface JourneyTrackItemViewModel extends EmployeeJourneyTrackItemModel {
  compactDetails: ReadonlyArray<JourneyDetailEntryViewModel>;
}

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
  protected readonly timelineTracks = computed(() =>
    (this.journey()?.tracks ?? []).map((track) => ({
      ...track,
      items: track.items.map((item) => ({
        ...item,
        compactDetails: this.toCompactDetails(item),
      })),
    })),
  );
  protected readonly hasEvents = computed(() => this.timelineTracks().length > 0);
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

  protected buildPeriodLabel(item: EmployeeJourneyTrackItemModel): string {
    if (!item.endDate) {
      return `${item.startDate} - ${this.texts.timelineOpenPeriodLabel}`;
    }

    return `${item.startDate} - ${item.endDate}`;
  }

  private toCompactDetails(item: EmployeeJourneyTrackItemModel): ReadonlyArray<JourneyDetailEntryViewModel> {
    return Object.entries(item.details)
      .map(([key, value]) => this.toDetailEntry(key, value))
      .filter((entry): entry is JourneyDetailEntryViewModel => entry !== null)
      .slice(0, 3);
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
      key: normalizedKey,
      value: displayValue,
    };
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