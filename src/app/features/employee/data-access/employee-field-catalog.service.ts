import { Injectable, inject, isDevMode } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';

import { DefaultService } from '../../../core/api/generated/api/default.service';
import {
  CatalogFieldBindingResponse,
  CatalogFieldBindingResponseCatalogKindEnum,
} from '../../../core/api/generated/model/catalog-field-binding-response';
import { DirectCatalogOptionResponse } from '../../../core/api/generated/model/direct-catalog-option-response';
import { SlotKeyOption } from '../shared/ui/section/editable-slot-section.model';
import { getCatalogDisplay } from '../shared/utils/catalog-display.util';

const employeeCatalogFields = {
  contactType: { resourceCode: 'employee.contact', fieldCode: 'contactTypeCode' },
  identifierType: { resourceCode: 'employee.identifier', fieldCode: 'identifierTypeCode' },
  addressType: { resourceCode: 'employee.address', fieldCode: 'addressTypeCode' },
  workCenter: { resourceCode: 'employee.work_center', fieldCode: 'workCenterCode' },
  contractType: { resourceCode: 'employee.contract', fieldCode: 'contractTypeCode' },
  laborClassificationAgreement: { resourceCode: 'employee.labor_classification', fieldCode: 'agreementCode' },
  presenceCompany: { resourceCode: 'employee.presence', fieldCode: 'companyCode' },
  presenceEntryReason: { resourceCode: 'employee.presence', fieldCode: 'entryReasonCode' },
  presenceExitReason: { resourceCode: 'employee.presence', fieldCode: 'exitReasonCode' },
  costCenter: { resourceCode: 'employee.cost_center', fieldCode: 'costCenterCode' },
} as const;

type CatalogFieldSpec = (typeof employeeCatalogFields)[keyof typeof employeeCatalogFields];

interface DirectCatalogContext {
  ruleSystemCode: string;
  resourceCode: string;
  fieldCode: string;
  ruleEntityTypeCode?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeFieldCatalogService {
  private readonly api = inject(DefaultService);

  private readonly bindingsByResourceCache = new Map<string, Observable<ReadonlyArray<CatalogFieldBindingResponse>>>();
  private readonly optionsByDirectCatalogCache = new Map<string, Observable<ReadonlyArray<SlotKeyOption<string>>>>();

  loadContactTypeOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.contactType);
  }

  loadIdentifierTypeOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.identifierType);
  }

  loadAddressTypeOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.addressType);
  }

  loadWorkCenterOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.workCenter);
  }

  loadContractTypeOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.contractType);
  }

  loadLaborClassificationAgreementOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.laborClassificationAgreement);
  }

  loadPresenceCompanyOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.presenceCompany);
  }

  loadPresenceEntryReasonOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.presenceEntryReason);
  }

  loadPresenceExitReasonOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.presenceExitReason);
  }

  loadCostCenterOptions(ruleSystemCode: string): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    return this.loadDirectOptionsByField(ruleSystemCode, employeeCatalogFields.costCenter);
  }

  private loadDirectOptionsByField(
    ruleSystemCode: string,
    fieldSpec: CatalogFieldSpec,
  ): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    const normalizedRuleSystemCode = this.normalizeRequiredValue(ruleSystemCode);
    if (!normalizedRuleSystemCode) {
      return of([]);
    }

    return this.getBindingsByResource(fieldSpec.resourceCode).pipe(
      map((bindings) => this.findDirectBinding(bindings, fieldSpec.fieldCode)),
      switchMap((binding) => {
        if (!binding?.ruleEntityTypeCode) {
          this.reportDevWarning(
            `Missing active DIRECT binding for ${fieldSpec.resourceCode}.${fieldSpec.fieldCode}; falling back to empty options.`,
          );
          return of([]);
        }

        return this.getDirectOptions(normalizedRuleSystemCode, binding.ruleEntityTypeCode, {
          ruleSystemCode: normalizedRuleSystemCode,
          resourceCode: fieldSpec.resourceCode,
          fieldCode: fieldSpec.fieldCode,
          ruleEntityTypeCode: binding.ruleEntityTypeCode,
        });
      }),
    );
  }

  private getBindingsByResource(resourceCode: string): Observable<ReadonlyArray<CatalogFieldBindingResponse>> {
    const normalizedResourceCode = this.normalizeRequiredValue(resourceCode);
    const cached = this.bindingsByResourceCache.get(normalizedResourceCode);
    if (cached) {
      return cached;
    }

    const request = this.api
      .getCatalogBindingsByResourceCode({ resourceCode: normalizedResourceCode })
      .pipe(
        map((response) => response.fields ?? []),
        catchError(() => {
          this.reportDevWarning(
            `Failed to load catalog bindings for ${normalizedResourceCode}; falling back to empty bindings.`,
          );
          return of([]);
        }),
        shareReplay(1),
      );

    this.bindingsByResourceCache.set(normalizedResourceCode, request);
    return request;
  }

  private getDirectOptions(
    ruleSystemCode: string,
    ruleEntityTypeCode: string,
    context: DirectCatalogContext,
  ): Observable<ReadonlyArray<SlotKeyOption<string>>> {
    const normalizedRuleEntityTypeCode = this.normalizeRequiredValue(ruleEntityTypeCode);
    if (!normalizedRuleEntityTypeCode) {
      return of([]);
    }

    const cacheKey = `${ruleSystemCode}|${normalizedRuleEntityTypeCode}`;
    const cached = this.optionsByDirectCatalogCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request = this.api
      .getDirectCatalogOptions({
        ruleSystemCode,
        ruleEntityTypeCode: normalizedRuleEntityTypeCode,
      })
      .pipe(
        map((response) => response.items ?? []),
        map((items) => this.mapOptions(items)),
        catchError(() => {
          this.reportDevWarning(
            `Failed to load direct options for ${context.resourceCode}.${context.fieldCode} (${context.ruleEntityTypeCode}) in ${context.ruleSystemCode}; falling back to empty options.`,
          );
          return of([]);
        }),
        shareReplay(1),
      );

    this.optionsByDirectCatalogCache.set(cacheKey, request);
    return request;
  }

  private findDirectBinding(
    bindings: ReadonlyArray<CatalogFieldBindingResponse>,
    fieldCode: string,
  ): CatalogFieldBindingResponse | null {
    const normalizedFieldCode = this.normalizeRequiredValue(fieldCode);

    return (
      bindings.find(
        (binding) =>
          binding.active === true
          && binding.fieldCode.trim() === normalizedFieldCode
          && binding.catalogKind === CatalogFieldBindingResponseCatalogKindEnum.Direct,
      ) ?? null
    );
  }

  private mapOptions(items: ReadonlyArray<DirectCatalogOptionResponse>): ReadonlyArray<SlotKeyOption<string>> {
    return items
      .filter((item) => item.active === true)
      .map((item) => {
        const display = getCatalogDisplay(item.name, item.code);
        const label = display.code ? `${display.label} · ${display.code}` : display.label;

        return {
          value: item.code,
          label,
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  private normalizeRequiredValue(value: string): string {
    return value.trim();
  }

  private reportDevWarning(message: string): void {
    if (!isDevMode()) {
      return;
    }

    console.warn(`[EmployeeFieldCatalogService] ${message}`);
  }
}
