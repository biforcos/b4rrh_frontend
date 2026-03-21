import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { mapCreateRuleEntityFormToRequest } from '../mapper/create-rule-entity-form.mapper';
import { CreateRuleEntityFormModel } from '../models/create-rule-entity-form.model';
import { CatalogStore } from '../store/catalog.store';
import { catalogTexts } from '../catalog.texts';
import { CreateRuleEntityFormComponent } from './create-rule-entity-form.component';
import { RuleEntityListComponent } from './rule-entity-list.component';
import { RuleEntityTypeListComponent } from './rule-entity-type-list.component';
import { RuleSystemSelectorComponent } from './rule-system-selector.component';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RuleSystemSelectorComponent,
    RuleEntityTypeListComponent,
    RuleEntityListComponent,
    CreateRuleEntityFormComponent,
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  private readonly store = inject(CatalogStore);

  protected readonly texts = catalogTexts;
  protected readonly ruleSystems = this.store.ruleSystems;
  protected readonly selectedRuleSystemCode = this.store.selectedRuleSystemCode;
  protected readonly ruleEntityTypes = this.store.ruleEntityTypes;
  protected readonly selectedRuleEntityTypeCode = this.store.selectedRuleEntityTypeCode;
  protected readonly ruleEntities = this.store.ruleEntities;
  protected readonly loadingRuleSystems = this.store.loadingRuleSystems;
  protected readonly loadingRuleEntityTypes = this.store.loadingRuleEntityTypes;
  protected readonly loadingRuleEntities = this.store.loadingRuleEntities;
  protected readonly creating = this.store.creating;
  protected readonly errorMessage = this.store.errorMessage;
  protected readonly successMessage = this.store.successMessage;
  protected readonly createResetToken = this.store.createResetToken;

  protected readonly hasContext = computed(
    () => this.selectedRuleSystemCode() !== null && this.selectedRuleEntityTypeCode() !== null,
  );

  constructor() {
    this.store.initialize();
  }

  protected onRuleSystemChanged(code: string): void {
    this.store.selectRuleSystem(code);
  }

  protected onRuleEntityTypeSelected(code: string): void {
    this.store.selectRuleEntityType(code);
  }

  protected createEntity(formValue: CreateRuleEntityFormModel): void {
    const ruleSystemCode = this.selectedRuleSystemCode();
    const ruleEntityTypeCode = this.selectedRuleEntityTypeCode();

    if (!ruleSystemCode || !ruleEntityTypeCode) {
      return;
    }

    const request = mapCreateRuleEntityFormToRequest(formValue, ruleSystemCode, ruleEntityTypeCode);
    this.store.createRuleEntity(request);
  }

  protected clearFeedback(): void {
    this.store.clearFeedback();
  }
}
