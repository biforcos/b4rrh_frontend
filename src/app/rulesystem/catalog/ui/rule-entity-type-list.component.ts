import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { RuleEntityTypeModel } from '../models/rule-entity-type.model';

@Component({
  selector: 'app-rule-entity-type-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rule-entity-type-list.component.html',
  styleUrl: './rule-entity-type-list.component.scss',
})
export class RuleEntityTypeListComponent {
  readonly items = input<ReadonlyArray<RuleEntityTypeModel>>([]);
  readonly selectedCode = input<string | null>(null);
  readonly disabled = input(false);
  readonly selected = output<string>();

  protected select(code: string): void {
    this.selected.emit(code);
  }
}
