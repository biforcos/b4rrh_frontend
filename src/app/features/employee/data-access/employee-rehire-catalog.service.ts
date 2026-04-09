import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { DefaultService } from '../../../core/api/generated/api/default.service';
import { ContractSubtypeCatalogItemResponse, AgreementCategoryCatalogItemResponse } from '../../../core/api/generated/model/models';
import { EmployeeFieldCatalogService } from './employee-field-catalog.service';
import { SlotKeyOption } from '../shared/ui/section/editable-slot-section.model';
import { employeeTexts } from '../employee.texts';

@Injectable({
  providedIn: 'root',
})
export class EmployeeRehireCatalogService {
  private readonly api = inject(DefaultService);
  private readonly fieldCatalog = inject(EmployeeFieldCatalogService);

  readonly companies = signal<SlotKeyOption<string>[]>([]);
  readonly entryReasons = signal<SlotKeyOption<string>[]>([]);
  readonly workCenters = signal<SlotKeyOption<string>[]>([]);
  readonly contractTypes = signal<SlotKeyOption<string>[]>([]);
  readonly contractSubtypes = signal<SlotKeyOption<string>[]>([]);
  readonly agreements = signal<SlotKeyOption<string>[]>([]);
  readonly agreementCategories = signal<SlotKeyOption<string>[]>([]);
  readonly costCenterOptions = signal<SlotKeyOption<string>[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private pendingRequests = 0;
  private lastRuleSystemCode: string | null = null;

  loadForRuleSystem(ruleSystemCode: string): void {
    if (!ruleSystemCode || ruleSystemCode.trim().length === 0) {
      this.error.set('Invalid rule system code');
      return;
    }

    this.lastRuleSystemCode = ruleSystemCode.trim();
    this.error.set(null);

    this.workCenters.set([]);
    this.loadCompanies(ruleSystemCode);
    this.loadEntryReasons(ruleSystemCode);
    this.loadContractTypes(ruleSystemCode);
    this.loadAgreements(ruleSystemCode);
    this.loadCostCenterOptions(ruleSystemCode);
  }

  private startRequest(): void {
    this.pendingRequests += 1;
    this.loading.set(true);
  }

  private finishRequest(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    if (this.pendingRequests === 0) this.loading.set(false);
  }

  loadWorkCentersByCompany(companyCode: string): void {
    const ruleSystemCode = this.lastRuleSystemCode;
    if (!ruleSystemCode || !companyCode) {
      this.workCenters.set([]);
      return;
    }

    this.startRequest();
    this.fieldCatalog.loadWorkCenterOptionsByCompany(ruleSystemCode, companyCode).pipe(take(1)).subscribe({
      next: (opts) => this.workCenters.set([...opts]),
      error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
      complete: () => this.finishRequest(),
    });
  }

  clearWorkCenters(): void {
    this.workCenters.set([]);
  }

  private loadCompanies(ruleSystemCode: string): void {
    this.startRequest();
    this.fieldCatalog.loadPresenceCompanyOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.companies.set([...opts]),
      error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
      complete: () => this.finishRequest(),
    });
  }

  private loadEntryReasons(ruleSystemCode: string): void {
    this.startRequest();
    this.fieldCatalog.loadPresenceEntryReasonOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.entryReasons.set([...opts]),
      error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
      complete: () => this.finishRequest(),
    });
  }

  private loadContractTypes(ruleSystemCode: string): void {
    this.startRequest();
    this.fieldCatalog.loadContractTypeOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.contractTypes.set([...opts]),
      error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
      complete: () => this.finishRequest(),
    });
  }

  loadContractSubtypes(contractTypeCode: string): void {
    const rs = this.lastRuleSystemCode;
    if (!rs || !contractTypeCode) {
      this.contractSubtypes.set([]);
      return;
    }

    this.startRequest();
    this.api
      .listContractCatalogSubtypes({ ruleSystemCode: rs, contractTypeCode })
      .pipe(take(1))
      .subscribe({
        next: (resp) => {
          const items = (resp || []) as ContractSubtypeCatalogItemResponse[];
          this.contractSubtypes.set(items.map((i) => ({ value: i.code, label: `${i.name ?? ''} · ${i.code}` })));
        },
        error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
        complete: () => this.finishRequest(),
      });
  }

  private loadAgreements(ruleSystemCode: string): void {
    this.startRequest();
    this.fieldCatalog.loadLaborClassificationAgreementOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.agreements.set([...opts]),
      error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
      complete: () => this.finishRequest(),
    });
  }

  loadAgreementCategories(agreementCode: string): void {
    const rs = this.lastRuleSystemCode;
    if (!rs || !agreementCode) {
      this.agreementCategories.set([]);
      return;
    }

    this.startRequest();
    this.api
      .listLaborClassificationAgreementCategories({ ruleSystemCode: rs, agreementCode })
      .pipe(take(1))
      .subscribe({
        next: (resp) => {
          const items = (resp || []) as AgreementCategoryCatalogItemResponse[];
          this.agreementCategories.set(items.map((i) => ({ value: i.code, label: `${i.name ?? ''} · ${i.code}` })));
        },
        error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
        complete: () => this.finishRequest(),
      });
  }

  private loadCostCenterOptions(ruleSystemCode: string): void {
    this.startRequest();
    this.fieldCatalog.loadCostCenterOptions(ruleSystemCode).pipe(take(1)).subscribe({
      next: (opts) => this.costCenterOptions.set([...opts]),
      error: () => this.error.set(employeeTexts.catalogLoadFailedMessage),
      complete: () => this.finishRequest(),
    });
  }

  clearContractSubtypes(): void {
    this.contractSubtypes.set([]);
  }

  clearAgreementCategories(): void {
    this.agreementCategories.set([]);
  }
}
