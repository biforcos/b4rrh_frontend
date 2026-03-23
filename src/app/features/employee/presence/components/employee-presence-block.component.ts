import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';
import { getCatalogDisplay } from '../../shared/utils/catalog-display.util';

export interface EmployeePresenceBlockItemModel {
  presenceNumber: number;
  companyCode: string;
  companyName?: string | null;
  entryReasonCode: string;
  entryReasonName?: string | null;
  exitReasonCode: string | null;
  exitReasonName?: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export type EmployeePresenceCurrentKind = 'active' | 'active-most-recent' | 'latest-closed';

export interface EmployeePresenceBlockModel {
  currentPresence?: EmployeePresenceBlockItemModel | null;
  currentPresenceKind?: EmployeePresenceCurrentKind | null;
  presenceHistory?: ReadonlyArray<EmployeePresenceBlockItemModel>;
}

@Component({
  selector: 'app-employee-presence-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-presence-block.component.html',
  styleUrl: './employee-presence-block.component.scss',
})
export class EmployeePresenceBlockComponent {
  readonly presence = input<EmployeePresenceBlockModel | null>(null);
  readonly companyLabelsByCode = input<Readonly<Record<string, string>>>({});
  readonly entryReasonLabelsByCode = input<Readonly<Record<string, string>>>({});
  readonly exitReasonLabelsByCode = input<Readonly<Record<string, string>>>({});

  protected readonly texts = employeeTexts;
  protected readonly currentPresence = computed(() => this.presence()?.currentPresence ?? null);
  protected readonly currentPresenceKind = computed(() => this.presence()?.currentPresenceKind ?? null);
  protected readonly presenceHistory = computed(() => this.presence()?.presenceHistory ?? []);
  protected readonly hasAnyData = computed(
    () => Boolean(this.currentPresence()) || this.presenceHistory().length > 0,
  );

  protected readonly hasHistory = computed(() => this.presenceHistory().length > 0);

  protected buildPeriodLabel(presence: EmployeePresenceBlockItemModel): string {
    if (!presence.endDate) {
      return `${presence.startDate} - ${this.texts.presenceBlockOpenPeriodLabel}`;
    }

    return `${presence.startDate} - ${presence.endDate}`;
  }

  protected resolveCurrentKindLabel(): string {
    const currentKind = this.currentPresenceKind();

    if (currentKind === 'active') {
      return this.texts.presenceBlockCurrentActiveLabel;
    }

    if (currentKind === 'active-most-recent') {
      return this.texts.presenceBlockCurrentActiveMostRecentLabel;
    }

    return this.texts.presenceBlockCurrentLatestClosedLabel;
  }

  protected resolveCurrentSectionLabel(): string {
    const currentKind = this.currentPresenceKind();

    if (currentKind === 'active' || currentKind === 'active-most-recent') {
      return this.texts.presenceBlockCurrentActiveSectionLabel;
    }

    return this.texts.presenceBlockCurrentSectionLabel;
  }

  protected resolveCompanyLabel(presence: EmployeePresenceBlockItemModel): string {
    const catalogLabel = this.companyLabelsByCode()[presence.companyCode];
    if (catalogLabel) {
      return catalogLabel;
    }

    return getCatalogDisplay(presence.companyName, presence.companyCode).label;
  }

  protected resolveCompanyCodeSecondary(presence: EmployeePresenceBlockItemModel): string | undefined {
    if (this.companyLabelsByCode()[presence.companyCode]) {
      return undefined;
    }

    return getCatalogDisplay(presence.companyName, presence.companyCode).code;
  }

  protected resolveEntryReasonLabel(presence: EmployeePresenceBlockItemModel): string {
    const catalogLabel = this.entryReasonLabelsByCode()[presence.entryReasonCode];
    if (catalogLabel) {
      return catalogLabel;
    }

    return getCatalogDisplay(presence.entryReasonName, presence.entryReasonCode).label;
  }

  protected resolveEntryReasonCodeSecondary(presence: EmployeePresenceBlockItemModel): string | undefined {
    if (this.entryReasonLabelsByCode()[presence.entryReasonCode]) {
      return undefined;
    }

    return getCatalogDisplay(presence.entryReasonName, presence.entryReasonCode).code;
  }

  protected resolveExitReasonLabel(presence: EmployeePresenceBlockItemModel): string {
    const exitReasonCode = presence.exitReasonCode ?? '';
    const catalogLabel = this.exitReasonLabelsByCode()[exitReasonCode];
    if (catalogLabel) {
      return catalogLabel;
    }

    return getCatalogDisplay(presence.exitReasonName, presence.exitReasonCode ?? '').label;
  }

  protected resolveExitReasonCodeSecondary(presence: EmployeePresenceBlockItemModel): string | undefined {
    const exitReasonCode = presence.exitReasonCode ?? '';
    if (this.exitReasonLabelsByCode()[exitReasonCode]) {
      return undefined;
    }

    return getCatalogDisplay(presence.exitReasonName, presence.exitReasonCode ?? '').code;
  }

  protected resolveStatusLabel(presence: EmployeePresenceBlockItemModel): string {
    return presence.isActive ? this.texts.presenceBlockStatusActive : this.texts.presenceBlockStatusClosed;
  }
}
