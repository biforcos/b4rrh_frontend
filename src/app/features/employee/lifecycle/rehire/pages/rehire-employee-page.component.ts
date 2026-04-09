import { ChangeDetectionStrategy, Component, effect, inject, untracked, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeRehireStore, RehireEmployeeErrorCode } from '../../../data-access/employee-rehire.store';
import { EmployeeRehireCatalogService } from '../../../data-access/employee-rehire-catalog.service';
import { GlobalMessageService } from '../../../data-access/employee-global-message.store';
import { employeeTexts } from '../../../employee.texts';
import { buildEmployeeDetailRouteCommands } from '../../../routing/employee-route-builder.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { EmployeeCostCenterDistributionEditorComponent } from '../../../organization/components/employee-cost-center-distribution-editor.component';
import { EmployeeDetailStore } from '../../../data-access/employee-detail.store';
import { RehireEmployeeDraft } from '../../../models/employee-rehire.model';
import { readEmployeeBusinessKeyFromParamMap } from '../../../routing/employee-route-key.util';
import { formatLocalDate } from '../../../shared/utils/local-date-string.util';

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
    CardModule,
    EmployeeCostCenterDistributionEditorComponent,
  ],
  templateUrl: './rehire-employee-page.component.html',
  styleUrls: ['./rehire-employee-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehireEmployeePageComponent {
  private static readonly GLOBAL_SOURCE_KEY = 'rehire-employee-page';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rehireStore = inject(EmployeeRehireStore);
  private readonly rehireCatalog = inject(EmployeeRehireCatalogService);
  private readonly detailStore = inject(EmployeeDetailStore);
  private readonly globalMessageService = inject(GlobalMessageService);

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

    effect((onCleanup) => {
      const messages = this.buildGlobalMessages();
      untracked(() => {
        this.globalMessageService.setSourceMessages(RehireEmployeePageComponent.GLOBAL_SOURCE_KEY, messages);
      });
      onCleanup(() => {
        untracked(() => this.globalMessageService.clearSourceMessages(RehireEmployeePageComponent.GLOBAL_SOURCE_KEY));
      });
    });

    const key = readEmployeeBusinessKeyFromParamMap(this.route.snapshot.paramMap);
    if (!key) {
      this.rehireCatalog.error.set(this.texts.rehireEmployeeMissingKeyRouteMessage);
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
        untracked(() => {
          this.globalMessageService.success(this.texts.rehireEmployeeSuccessMessage, {
            id: 'rehire-employee-success',
            sectionId: 'overview',
            sectionLabel: this.texts.detailPanelTitle,
          });
        });
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
      this.rehireCatalog.error.set(this.texts.rehireEmployeeMissingKeyMessage);
      return;
    }

    const val = this.form.getRawValue();
    const draft: RehireEmployeeDraft = {
      ruleSystemCode: key.ruleSystemCode,
      employeeTypeCode: key.employeeTypeCode,
      employeeNumber: key.employeeNumber,
      rehireDate: formatLocalDate(val.rehireDate as Date),
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
        return this.texts.rehireEmployeeNotFoundMessage;
      case 'already-active':
        return this.texts.rehireEmployeeAlreadyActiveMessage;
      case 'invalid-rehire-date':
        return this.texts.rehireEmployeeInvalidDateMessage;
      case 'invalid-distribution':
        return this.texts.rehireEmployeeInvalidDistributionMessage;
      case 'invalid-dependent-relation':
        return this.texts.rehireEmployeeInvalidDependentRelationMessage;
      case 'invalid-catalog-value':
        return this.texts.rehireEmployeeInvalidCatalogMessage;
      default:
        return this.texts.rehireEmployeeRequestFailedMessage;
    }
  }

  private buildGlobalMessages() {
    const messages = [];
    const catalogError = this.catalogError();
    if (catalogError) {
      messages.push({
        id: 'rehire-catalog-error',
        level: 'error' as const,
        text: catalogError,
      });
    }

    const error = this.error();
    if (error) {
      messages.push({
        id: 'rehire-request-error',
        level: 'error' as const,
        text: this.mapErrorMessage(error),
      });
    }

    return messages;
  }
}
