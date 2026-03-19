import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { EmployeeDetailModel } from '../../models/employee-detail.model';

interface TimelineEventViewModel {
  title: string;
  moment: string;
}

@Component({
  selector: 'app-employee-detail-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-detail-timeline.component.html',
  styleUrl: './employee-detail-timeline.component.scss',
})
export class EmployeeDetailTimelineComponent {
  readonly employee = input.required<EmployeeDetailModel>();

  protected readonly texts = employeeTexts;
  protected readonly timelineEvents = computed<ReadonlyArray<TimelineEventViewModel>>(() => {
    const employee = this.employee();

    return [
      {
        title: this.texts.timelineEventOnboardingTitle,
        moment: employee.statusLabel,
      },
      {
        title: this.texts.timelineEventRoleChangeTitle,
        moment: this.texts.timelineEventRoleChangeDate,
      },
      {
        title: this.texts.timelineEventWorkCenterTitle,
        moment: employee.workCenter,
      },
    ];
  });
}
