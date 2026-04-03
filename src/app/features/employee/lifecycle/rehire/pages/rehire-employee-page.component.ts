import { ChangeDetectionStrategy, Component, inject, signal, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeRehireStore, RehireEmployeeErrorCode } from '../../../data-access/employee-rehire.store';
import { EmployeeRehireCatalogService } from '../../../data-access/employee-rehire-catalog.service';
import { employeeTexts } from '../../../employee.texts';
import { buildEmployeeDetailRouteCommands } from '../../../routing/employee-route-builder.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { EmployeeCostCenterDistributionEditorComponent } from '../../../organization/components/employee-cost-center-distribution-editor.component';
import { EmployeeDetailStore } from '../../../data-access/employee-detail.store';
import { RehireEmployeeDraft } from '../../../models/employee-rehire.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../../routing/employee-route-key.util';

@Component({
  selector: 'app-rehire-employee-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    MessageModule,
    CardModule,
    EmployeeCostCenterDistributionEditorComponent,
  ],
  templateUrl: './rehire-employee-page.component.html',
  styleUrls: ['./rehire-employee-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehireEmployeePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rehireStore = inject(EmployeeRehireStore);
  private readonly rehireCatalog = inject(EmployeeRehireCatalogService);
  private readonly detailStore = inject(EmployeeDetailStore);

  readonly texts = employeeTexts;

  readonly form = this.fb.group({
    rehireDate: [new Date(), Validators.required],
    companyCode: ['', Validators.required],
    entryReasonCode: ['', Validators.required],
    workCenterCode: ['', Validators.required],
    contractTypeCode: ['', Validators.required],
    contractSubtypeCode: [''],
    agreementCode: ['', Validators.required],
    agreementCategoryCode: ['', Validators.required],
  });

  // Bind catalog signals from catalog service
  readonly companies = this.rehireCatalog.companies;
  readonly entryReasons = this.rehireCatalog.entryReasons;
  readonly workCenters = this.rehireCatalog.workCenters;
  readonly contractTypes = this.rehireCatalog.contractTypes;
  readonly contractSubtypes = this.rehireCatalog.contractSubtypes;
  readonly agreements = this.rehireCatalog.agreements;
  readonly agreementCategories = this.rehireCatalog.agreementCategories;
  readonly costCenterOptions = this.rehireCatalog.costCenterOptions;
  readonly catalogLoading = this.rehireCatalog.loading;
  readonly catalogError = this.rehireCatalog.error;

  readonly rehiring = this.rehireStore.rehiring;
  readonly error = this.rehireStore.error;
  readonly result = this.rehireStore.result;

  // Expose selected employee detail for template
  readonly detail = this.detailStore.selectedEmployeeDetail;

  @ViewChild('ccEditor') costCenterEditor?: EmployeeCostCenterDistributionEditorComponent;

  constructor() {
    this.rehireStore.reset();

    const key = readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap);
    if (!key) {
      this.rehireCatalog.error.set('Missing employee key in route');
      return;
    }

    const ruleSystemCode = key.ruleSystemCode;

    // Load all top-level catalogs for the rule system
    this.rehireCatalog.loadForRuleSystem(ruleSystemCode);

    // Dependent selectors: wire form changes to catalog loader using takeUntilDestroyed to avoid leaks
    this.form
      .get('contractTypeCode')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((ct: string | null) => {
        if (ct) {
          this.rehireCatalog.loadContractSubtypes(ct);
        } else {
          this.rehireCatalog.clearContractSubtypes();
        }
      });

    this.form
      .get('agreementCode')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((ac: string | null) => {
        if (ac) {
          this.rehireCatalog.loadAgreementCategories(ac);
        } else {
          this.rehireCatalog.clearAgreementCategories();
        }
      });

    // Navigate on success
    effect(() => {
      const res = this.rehireStore.result();
      if (res) {
        const commands = buildEmployeeDetailRouteCommands(res.employeeKey, 'overview');
        void this.router.navigate(commands);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const key = readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap);
    if (!key) {
      this.rehireCatalog.error.set('Missing employee key');
      return;
    }

    const val = this.form.getRawValue();
    const draft: RehireEmployeeDraft = {
      ruleSystemCode: key.ruleSystemCode,
      employeeTypeCode: key.employeeTypeCode,
      employeeNumber: key.employeeNumber,
      rehireDate: (val.rehireDate as Date).toISOString().split('T')[0],
      entryReasonCode: val.entryReasonCode ?? '',
      companyCode: val.companyCode ?? '',
      workCenterCode: val.workCenterCode ?? '',
      contractTypeCode: val.contractTypeCode ?? '',
      contractSubtypeCode: val.contractSubtypeCode ?? '',
      agreementCode: val.agreementCode ?? '',
      agreementCategoryCode: val.agreementCategoryCode ?? '',
      costCenterDistribution: null,
    };

    if (this.costCenterEditor && this.costCenterEditor.isValid()) {
      draft.costCenterDistribution = this.costCenterEditor.getValue();
    }

    this.rehireStore.rehire(draft);
  }

  onCancel() {
    const key = readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap);
    if (!key) {
      void this.router.navigate(['/personas/empleados']);
      return;
    }
    void this.router.navigate(buildEmployeeDetailRouteCommands(key, 'overview'));
  }

  mapErrorMessage(code: RehireEmployeeErrorCode | null): string {
    switch (code) {
      case 'employee-not-found':
        return 'Employee or rule system not found';
      case 'already-active':
        return 'Employee is already active';
      case 'invalid-rehire-date':
        return 'Invalid rehire date';
      case 'invalid-distribution':
        return 'Invalid cost center distribution';
      case 'invalid-dependent-relation':
        return 'Invalid dependent relation';
      case 'invalid-catalog-value':
        return 'Invalid catalog value';
      default:
        return 'Request failed';
    }
  }
}
