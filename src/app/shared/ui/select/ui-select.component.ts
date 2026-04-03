import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SlotKeyOption } from '../../../features/employee/shared/ui/section/editable-slot-section.model';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectModule, FormsModule],
  template: `
    <p-select
      [id]="inputId() ?? undefined"
      [options]="selectOptions()"
      optionLabel="label"
      optionValue="value"
      [ngModel]="value()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel() ?? undefined"
      (ngModelChange)="onSelectionChange($event)"
      [placeholder]="placeholder() ?? undefined"
      [fluid]="true"
    />
  `,
  styles: [`
    :host { display: block; width: 100%; }
    :host ::ng-deep .p-select { width: 100%; }
  `],
})
export class UiSelectComponent {
  readonly value = input<string | null>('');
  readonly options = input<ReadonlyArray<SlotKeyOption<string>>>([]);
  readonly placeholder = input<string | null>(null);
  readonly inputId = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);

  protected readonly selectOptions = computed(() => this.options() as any[]);

  readonly valueChanged = output<string>();

  protected onSelectionChange(newValue: string): void {
    this.valueChanged.emit(newValue);
  }
}
