import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { companyTexts } from '../company.texts';
import { CompanyListItemModel } from '../models/company-list-item.model';
import { CompanyBusinessKey } from '../models/company-ui-state.model';
import { MasterListPanelComponent } from '../../../shared/ui/master-list-panel/master-list-panel.component';
import { UiTagComponent } from '../../../shared/ui/tag/ui-tag.component';

@Component({
  selector: 'app-company-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MasterListPanelComponent, UiTagComponent],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent {
  readonly companies = input.required<ReadonlyArray<CompanyListItemModel>>();
  readonly selectedKey = input<CompanyBusinessKey | null>(null);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly companySelected = output<CompanyBusinessKey>();
  readonly newRequested = output<void>();

  protected readonly texts = companyTexts;
  protected readonly selectedListKey = computed(() => {
    const key = this.selectedKey();
    return key ? this.companyKey(key.ruleSystemCode, key.companyCode) : null;
  });

  protected readonly companyKeyOf = (item: CompanyListItemModel): string =>
    this.companyKey(item.ruleSystemCode, item.companyCode);

  protected readonly matchesCompanyQuery = (item: CompanyListItemModel, normalizedQuery: string): boolean => {
    const haystack = [
      item.companyCode,
      item.ruleSystemCode,
      item.name,
      item.legalName,
      item.taxIdentifier ?? '',
      item.countryCode ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  };

  protected requestSelect(company: CompanyListItemModel): void {
    this.companySelected.emit({
      ruleSystemCode: company.ruleSystemCode,
      companyCode: company.companyCode,
    });
  }

  protected requestCreate(): void {
    this.newRequested.emit();
  }

  private companyKey(ruleSystemCode: string, companyCode: string): string {
    return `${ruleSystemCode}::${companyCode}`;
  }
}
