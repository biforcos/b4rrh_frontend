import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SlotKeyOption } from '../../../features/employee/shared/ui/section/editable-slot-section.model';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select
      [id]="inputId() ?? undefined"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() ?? undefined"
      [value]="value() ?? ''"
      (change)="onSelectionChange($event)"
    >
      <option value="" [disabled]="true" [hidden]="true">{{ placeholder() ?? '' }}</option>
      @for (opt of selectOptions(); track opt.value) {
        <option [value]="opt.value">{{ opt.label }}</option>
      }
    </select>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    select { width: 100%; }
  `],
})
export class UiSelectComponent {
  readonly value = input<string | null>('');
  readonly options = input<ReadonlyArray<SlotKeyOption<string>>>([]);
  readonly placeholder = input<string | null>(null);
  readonly inputId = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);

  protected readonly selectOptions = computed(() => this.options() as SlotKeyOption<string>[]);

  readonly valueChanged = output<string>();

  protected onSelectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.valueChanged.emit(select.value);
  }
}
