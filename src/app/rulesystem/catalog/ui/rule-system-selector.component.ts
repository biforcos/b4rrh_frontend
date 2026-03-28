import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiSelectComponent } from '../../../shared/ui/select/ui-select.component';
import { catalogTexts } from '../catalog.texts';
import { RuleSystemModel } from '../models/rule-system.model';

@Component({
  selector: 'app-rule-system-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSelectComponent],
  templateUrl: './rule-system-selector.component.html',
  styleUrl: './rule-system-selector.component.scss',
})
export class RuleSystemSelectorComponent {
  readonly ruleSystems = input<ReadonlyArray<RuleSystemModel>>([]);
  readonly selectedCode = input<string | null>(null);
  readonly disabled = input(false);
  readonly selectionChanged = output<string>();

  protected readonly texts = catalogTexts;

  protected onSelectionChange(code: string): void {
    this.selectionChanged.emit(code);
  }
}
