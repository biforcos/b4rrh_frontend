import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { companyTexts } from '../company.texts';
import { CompanyListItemModel } from '../models/company-list-item.model';
import { CompanyBusinessKey } from '../models/company-ui-state.model';

@Component({
  selector: 'app-company-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TableModule, TagModule, ButtonModule],
  templateUrl: './company-list.component.html',
})
export class CompanyListComponent {
  readonly companies = input.required<ReadonlyArray<CompanyListItemModel>>();
  readonly selectedKey = input<CompanyBusinessKey | null>(null);
  readonly loading = input(false);

  readonly editRequested = output<CompanyBusinessKey>();

  protected readonly texts = companyTexts;
  protected readonly tableCompanies = computed(() => [...this.companies()]);

  protected isSelected(company: CompanyListItemModel): boolean {
    const key = this.selectedKey();
    if (!key) return false;
    return key.ruleSystemCode === company.ruleSystemCode && key.companyCode === company.companyCode;
  }

  protected requestEdit(company: CompanyListItemModel): void {
    this.editRequested.emit({
      ruleSystemCode: company.ruleSystemCode,
      companyCode: company.companyCode,
    });
  }
}
