import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { catalogTexts } from '../catalog.texts';
import { RuleEntityModel } from '../models/rule-entity.model';

@Component({
  selector: 'app-rule-entity-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rule-entity-list.component.html',
  styleUrl: './rule-entity-list.component.scss',
})
export class RuleEntityListComponent {
  readonly items = input<ReadonlyArray<RuleEntityModel>>([]);
  protected readonly texts = catalogTexts;
}
