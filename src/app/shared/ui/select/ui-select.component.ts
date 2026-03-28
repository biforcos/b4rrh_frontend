import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-select">
      <select
        class="ui-select__control"
        [id]="inputId() ?? null"
        [value]="value() ?? ''"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        (change)="onChange($event)"
      >
        <ng-content />
      </select>

      <span class="ui-select__icon pi pi-chevron-down" aria-hidden="true"></span>
    </div>
  `,
  styleUrl: './ui-select.component.scss',
})
export class UiSelectComponent {
  readonly value = input<string | null>('');
  readonly inputId = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);

  readonly valueChanged = output<string>();

  protected onChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.valueChanged.emit(target.value);
  }
}
