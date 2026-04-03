import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-ui-date-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePickerModule, FormsModule],
  template: `
    <p-datepicker
      [id]="inputId() ?? undefined"
      [ngModel]="value()"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      [disabled]="disabled()"
      [readonlyInput]="readonly()"
      [ariaLabel]="ariaLabel() ?? undefined"
      (ngModelChange)="onDateChange($event)"
      dateFormat="yy-mm-dd"
      [showIcon]="true"
      [fluid]="true"
      appendTo="body"
    />
  `,
  styles: [`
    :host { display: block; width: 100%; }
    :host ::ng-deep .p-datepicker { width: 100%; }
  `],
})
export class UiDateInputComponent {
  readonly value = input<string | null>('');
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly inputId = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);
  readonly readonly = input(false);

  readonly valueChanged = output<string>();

  protected readonly minDate = () => this.min() ? new Date(this.min()!) : null;
  protected readonly maxDate = () => this.max() ? new Date(this.max()!) : null;

  protected onDateChange(newDate: Date | string | null): void {
    if (newDate instanceof Date) {
      this.valueChanged.emit(newDate.toISOString().slice(0, 10));
    } else if (typeof newDate === 'string') {
      this.valueChanged.emit(newDate);
    } else {
      this.valueChanged.emit('');
    }
  }
}
