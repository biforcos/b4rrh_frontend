import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { employeeTexts } from '../../employee.texts';

export interface EmployeePresenceBlockItemModel {
  presenceNumber: number;
  companyCode: string;
  entryReasonCode: string;
  exitReasonCode: string | null;
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

  protected buildCompanyPeriodLabel(presence: EmployeePresenceBlockItemModel): string {
    return `${presence.companyCode} · ${this.texts.presenceBlockPeriodNumberPrefix} #${presence.presenceNumber}`;
  }

  protected resolveStatusLabel(presence: EmployeePresenceBlockItemModel): string {
    return presence.isActive ? this.texts.presenceBlockStatusActive : this.texts.presenceBlockStatusClosed;
  }
}
