import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { catalogTexts } from '../catalog.texts';
import { RuleSystemModel } from '../models/rule-system.model';

@Component({
  selector: 'app-rule-system-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rule-system-selector.component.html',
  styleUrl: './rule-system-selector.component.scss',
})
export class RuleSystemSelectorComponent {
  readonly ruleSystems = input<ReadonlyArray<RuleSystemModel>>([]);
  readonly selectedCode = input<string | null>(null);
  readonly disabled = input(false);
  readonly selectionChanged = output<string>();

  protected readonly texts = catalogTexts;

  protected onSelectionChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.selectionChanged.emit(target.value);
  }
}
