import { ChangeDetectionStrategy, Component } from '@angular/core';

interface TimelineEventItem {
  readonly title: string;
  readonly period: string;
  readonly current: boolean;
}

@Component({
  selector: 'app-employee-timeline-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-timeline-panel.component.html',
  styleUrl: './employee-timeline-panel.component.scss',
})
export class EmployeeTimelinePanelComponent {
  protected readonly events: ReadonlyArray<TimelineEventItem> = [
    {
      title: 'Current employment',
      period: '2023 - Present',
      current: true,
    },
    {
      title: 'Previous employment',
      period: '2019 - 2023',
      current: false,
    },
  ];
}
