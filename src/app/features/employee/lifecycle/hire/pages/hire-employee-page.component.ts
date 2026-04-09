import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeHiringStore, HireEmployeeErrorCode } from '../../../data-access/employee-hiring.store';
import { EmployeeFieldCatalogService } from '../../../data-access/employee-field-catalog.service';
import { GlobalMessageService } from '../../../data-access/employee-global-message.store';
import { employeeTexts } from '../../../employee.texts';
import { buildEmployeeDetailRouteCommands } from '../../../routing/employee-route-builder.util';
import { DefaultService } from '../../../../../core/api/generated/api/default.service';
import { take } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { HIRE_EMPLOYEE_DEFAULTS } from '../../../models/hire-employee.defaults';
import { formatLocalDate } from '../../../shared/utils/local-date-string.util';
import { GlobalMessageRailComponent } from '../../../shell/components/global-message-rail.component';

@Component({
  selector: 'app-hire-employee-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    CardModule,
    GlobalMessageRailComponent,
  ],
  templateUrl: './hire-employee-page.component.html',
  styleUrl: './hire-employee-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HireEmployeePageComponent {
  private static readonly GLOBAL_SOURCE_KEY = 'hire-employee-page';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly hiringStore = inject(EmployeeHiringStore);
  private readonly catalogService = inject(EmployeeFieldCatalogService);
  private readonly api = inject(DefaultService);
  private readonly globalMessageService = inject(GlobalMessageService);

  protected readonly texts = employeeTexts;

  readonly form = this.fb.group({
    ruleSystemCode: ['', Validators.required],
    employeeNumber: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName1: ['', Validators.required],
    lastName2: [''],
    preferredName: [''],
    hireDate: [new Date(), Validators.required],
    companyCode: ['', Validators.required],
    entryReasonCode: ['', Validators.required],
    workCenterCode: ['', Validators.required],
    contractTypeCode: ['', Validators.required],
    contractSubtypeCode: [''],
    agreementCode: ['', Validators.required],
    agreementCategoryCode: ['', Validators.required],
  });

  // Options
  readonly ruleSystems = signal<any[]>([]);
  readonly companies = signal<any[]>([]);
  readonly entryReasons = signal<any[]>([]);
  readonly workCenters = signal<any[]>([]);
  readonly contractTypes = signal<any[]>([]);
  readonly contractSubtypes = signal<any[]>([]);
  readonly agreements = signal<any[]>([]);
  readonly agreementCategories = signal<any[]>([]);

  readonly catalogError = signal<string | null>(null);

  readonly hiring = (this.hiringStore as any).hiring;
  readonly error = (this.hiringStore as any).error;
  readonly globalMessages = this.globalMessageService.messages;
  readonly globalMessageSummary = this.globalMessageService.summary;
  readonly globalMessageExpanded = this.globalMessageService.expanded;

  constructor() {
    this.globalMessageService.reset();
    (this.hiringStore as any).reset();
    this.loadInitialCatalogs();

    effect((onCleanup) => {
      const messages = this.buildGlobalMessages();
      untracked(() => {
        this.globalMessageService.setSourceMessages(HireEmployeePageComponent.GLOBAL_SOURCE_KEY, messages);
      });
      onCleanup(() => {
        untracked(() => this.globalMessageService.clearSourceMessages(HireEmployeePageComponent.GLOBAL_SOURCE_KEY));
      });
    });

    effect(() => {
      const result = (this.hiringStore as any).result();
      if (result) {
        const commands = buildEmployeeDetailRouteCommands(result.employeeKey, 'overview');
        this.router.navigate(commands);
      }
    });

    this.form.get('ruleSystemCode')?.valueChanges.subscribe((rs: any) => {
      if (rs) {
        this.loadDependentCatalogs(rs);
      } else {
        this.resetOptions();
      }
    });

    this.form.get('contractTypeCode')?.valueChanges.subscribe((ct: any) => {
      const rs = this.form.get('ruleSystemCode')?.value;
      if (ct && rs) {
        this.loadContractSubtypes(rs, ct);
      } else {
        this.contractSubtypes.set([]);
      }
    });

    this.form.get('agreementCode')?.valueChanges.subscribe((ac: any) => {
      const rs = this.form.get('ruleSystemCode')?.value;
      if (ac && rs) {
        this.loadAgreementCategories(rs, ac);
      } else {
        this.agreementCategories.set([]);
      }
    });
  }

  private loadInitialCatalogs() {
    this.catalogError.set(null);
    (this.api as any)
      .listRuleSystems()
      .pipe(take(1))
      .subscribe({
        next: (rss: any) => {
          this.ruleSystems.set((rss || []).map((rs: any) => ({ value: rs.code, label: `${rs.name} · ${rs.code}` })));
        },
        error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
      });
  }

  private loadDependentCatalogs(ruleSystemCode: string) {
    this.catalogError.set(null);
    (this.catalogService as any).loadWorkCenterOptions(ruleSystemCode).subscribe({
      next: (opts: any) => this.workCenters.set([...opts]),
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
    (this.catalogService as any).loadPresenceCompanyOptions(ruleSystemCode).subscribe({
      next: (opts: any) => this.companies.set([...opts]),
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
    (this.catalogService as any).loadPresenceEntryReasonOptions(ruleSystemCode).subscribe({
      next: (opts: any) => this.entryReasons.set([...opts]),
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
    (this.catalogService as any).loadContractTypeOptions(ruleSystemCode).subscribe({
      next: (opts: any) => this.contractTypes.set([...opts]),
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
    (this.catalogService as any).loadLaborClassificationAgreementOptions(ruleSystemCode).subscribe({
      next: (opts: any) => this.agreements.set([...opts]),
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
  }

  private loadContractSubtypes(ruleSystemCode: string, contractTypeCode: string) {
    (this.api as any).listContractCatalogSubtypes({ ruleSystemCode, contractTypeCode }).subscribe({
      next: (resp: any) => {
        this.contractSubtypes.set((resp || []).map((i: any) => ({ value: i.code, label: `${i.name} · ${i.code}` })));
      },
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
  }

  private loadAgreementCategories(ruleSystemCode: string, agreementCode: string) {
    (this.api as any).listLaborClassificationAgreementCategories({ ruleSystemCode, agreementCode }).subscribe({
      next: (resp: any) => {
        this.agreementCategories.set((resp || []).map((i: any) => ({ value: i.code, label: `${i.name} · ${i.code}` })));
      },
      error: () => this.catalogError.set(this.texts.catalogLoadFailedMessage)
    });
  }

  private resetOptions() {
    this.workCenters.set([]);
    this.companies.set([]);
    this.entryReasons.set([]);
    this.contractTypes.set([]);
    this.contractSubtypes.set([]);
    this.agreements.set([]);
    this.agreementCategories.set([]);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const draft: any = {
      ...val,
      employeeTypeCode: HIRE_EMPLOYEE_DEFAULTS.employeeTypeCode,
      hireDate: formatLocalDate(val.hireDate as Date),
      costCenterDistribution: null,
    };

    (this.hiringStore as any).hire(draft);
  }

  onCancel() {
    this.router.navigate(['/personas/empleados']);
  }

  protected toggleGlobalMessages(): void {
    this.globalMessageService.toggleExpanded();
  }

  protected closeGlobalMessages(): void {
    const summary = this.globalMessageSummary();
    if (summary.errorCount === 0 && summary.warningCount === 0) {
      this.globalMessageService.dismissTransientMessages();
      return;
    }

    this.globalMessageService.collapse();
  }

  private buildGlobalMessages() {
    const messages = [];
    const catalogError = this.catalogError();
    if (catalogError) {
      messages.push({
        id: 'hire-catalog-error',
        level: 'error' as const,
        text: catalogError,
      });
    }

    const error = this.error() as HireEmployeeErrorCode | null;
    if (error) {
      messages.push({
        id: 'hire-request-error',
        level: 'error' as const,
        text: this.mapErrorMessage(error),
      });
    }

    return messages;
  }

  private mapErrorMessage(code: HireEmployeeErrorCode): string {
    if (code === 'already-exists') {
      return this.texts.hireEmployeeConflictMessage;
    }

    if (code === 'invalid-catalog-value' || code === 'invalid-dependent-relation') {
      return this.texts.hireEmployeeInvalidCatalogMessage;
    }

    return this.texts.hireEmployeeErrorMessage;
  }
}
