import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-ui-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputTextModule],
  template: `
    <input
      pInputText
      type="date"
      class="ui-date-input__control"
      [id]="inputId() ?? null"
      [value]="value() ?? ''"
      [min]="min() ?? null"
      [max]="max() ?? null"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [attr.aria-label]="ariaLabel() ?? null"
      (input)="onInput($event)"
    />
  `,
  styles: [
    ':host { display: block; width: 100%; }',
    ':host :where(.ui-date-input__control) { width: 100%; }',
  ],
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

  protected onInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.valueChanged.emit(target.value);
  }
}
