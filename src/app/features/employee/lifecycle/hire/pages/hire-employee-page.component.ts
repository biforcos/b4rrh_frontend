import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeHiringStore } from '../../../data-access/employee-hiring.store';
import { EmployeeFieldCatalogService } from '../../../data-access/employee-field-catalog.service';
import { employeeTexts } from '../../../employee.texts';
import { buildEmployeeDetailRouteCommands } from '../../../routing/employee-route-builder.util';
import { DefaultService } from '../../../../../core/api/generated/api/default.service';
import { take } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { HIRE_EMPLOYEE_DEFAULTS } from '../../../models/hire-employee.defaults';

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
    MessageModule,
    CardModule,
  ],
  templateUrl: './hire-employee-page.component.html',
  styleUrl: './hire-employee-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HireEmployeePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly hiringStore = inject(EmployeeHiringStore);
  private readonly catalogService = inject(EmployeeFieldCatalogService);
  private readonly api = inject(DefaultService);

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

  constructor() {
    (this.hiringStore as any).reset();
    this.loadInitialCatalogs();

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
      hireDate: (val.hireDate as Date).toISOString().split('T')[0],
      costCenterDistribution: null,
    };

    (this.hiringStore as any).hire(draft);
  }

  onCancel() {
    this.router.navigate(['/personas/empleados']);
  }
}
