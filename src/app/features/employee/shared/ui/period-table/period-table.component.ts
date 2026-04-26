import {
  ChangeDetectionStrategy, Component, ContentChild,
  TemplateRef, input, output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PeriodTableRow } from './period-table.model';

@Component({
  selector: 'app-period-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './period-table.component.html',
  styleUrl: './period-table.component.scss',
})
export class PeriodTableComponent<T extends PeriodTableRow = PeriodTableRow> {
  readonly rows = input<ReadonlyArray<T>>([]);
  readonly sectionTitle = input('');
  readonly addLabel = input('+ Nuevo período');
  readonly emptyMessage = input('Sin períodos registrados');

  readonly addClicked = output<void>();
  readonly editClicked = output<number>();
  readonly deleteClicked = output<number>();

  @ContentChild('columnHeaders') readonly columnHeadersTemplate: TemplateRef<unknown> | null = null;
  @ContentChild('cellContent') readonly cellContentTemplate: TemplateRef<{ $implicit: T; index: number }> | null = null;

  protected formatPeriod(row: T): string {
    return row.endDate ? `${row.startDate} — ${row.endDate}` : `${row.startDate} — en vigor`;
  }

  protected showEdit(row: T): boolean { return row.canEdit !== false; }
  protected showDelete(row: T): boolean { return !row.isActive && row.canDelete === true; }
  protected trackBy(index: number): number { return index; }
}
