import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

export interface EmployeeLaborClassificationBlockItemModel {
  agreementCode: string;
  agreementCategoryCode: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export type EmployeeLaborClassificationCurrentKind = 'active' | 'active-most-recent' | 'latest-closed';

export interface EmployeeLaborClassificationBlockModel {
  currentClassification?: EmployeeLaborClassificationBlockItemModel | null;
  currentClassificationKind?: EmployeeLaborClassificationCurrentKind | null;
  classificationHistory?: ReadonlyArray<EmployeeLaborClassificationBlockItemModel>;
}

@Component({
  selector: 'app-employee-labor-classification-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-labor-classification-block.component.html',
  styleUrl: './employee-labor-classification-block.component.scss',
})
export class EmployeeLaborClassificationBlockComponent {
  readonly classification = input<EmployeeLaborClassificationBlockModel | null>(null);

  protected readonly texts = employeeTexts;
  protected readonly currentClassification = computed(
    () => this.classification()?.currentClassification ?? null,
  );
  protected readonly currentClassificationKind = computed(
    () => this.classification()?.currentClassificationKind ?? null,
  );
  protected readonly classificationHistory = computed(
    () => this.classification()?.classificationHistory ?? [],
  );
  protected readonly hasAnyData = computed(
    () => Boolean(this.currentClassification()) || this.classificationHistory().length > 0,
  );
  protected readonly hasHistory = computed(() => this.classificationHistory().length > 0);

  protected buildPeriodLabel(classification: EmployeeLaborClassificationBlockItemModel): string {
    if (!classification.endDate) {
      return `${classification.startDate} - ${this.texts.laborClassificationBlockOpenPeriodLabel}`;
    }

    return `${classification.startDate} - ${classification.endDate}`;
  }

  protected resolveCurrentKindLabel(): string {
    const currentKind = this.currentClassificationKind();

    if (currentKind === 'active') {
      return this.texts.laborClassificationBlockCurrentActiveLabel;
    }

    if (currentKind === 'active-most-recent') {
      return this.texts.laborClassificationBlockCurrentActiveMostRecentLabel;
    }

    return this.texts.laborClassificationBlockCurrentLatestClosedLabel;
  }

  protected resolveCurrentSectionLabel(): string {
    const currentKind = this.currentClassificationKind();

    if (currentKind === 'active' || currentKind === 'active-most-recent') {
      return this.texts.laborClassificationBlockCurrentActiveSectionLabel;
    }

    return this.texts.laborClassificationBlockCurrentSectionLabel;
  }

  protected buildClassificationIdentityLabel(
    classification: EmployeeLaborClassificationBlockItemModel,
  ): string {
    return `${classification.agreementCode} · ${classification.agreementCategoryCode}`;
  }

  protected resolveStatusLabel(classification: EmployeeLaborClassificationBlockItemModel): string {
    return classification.isActive
      ? this.texts.laborClassificationBlockStatusActive
      : this.texts.laborClassificationBlockStatusClosed;
  }
}