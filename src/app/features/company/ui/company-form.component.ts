import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FieldsetModule } from 'primeng/fieldset';
import { MessageModule } from 'primeng/message';

import { companyTexts } from '../company.texts';
import { CompanyDetailModel } from '../models/company-detail.model';
import { CompanyFormValue } from '../models/company-form-value.model';
import { buildEmptyCompanyFormValue, buildCompanyFormValueFromDetail } from '../mapper/company-form.mapper';

export type CompanyFormMode = 'create' | 'edit';

@Component({
  selector: 'app-company-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    TextareaModule,
    FieldsetModule,
    MessageModule,
  ],
  templateUrl: './company-form.component.html',
})
export class CompanyFormComponent implements OnChanges {
  readonly mode = input.required<CompanyFormMode>();
  readonly detail = input<CompanyDetailModel | null>(null);
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);
  readonly submitSuccess = input<'created' | 'updated' | null>(null);

  readonly submitted = output<CompanyFormValue>();
  readonly cancelled = output<void>();

  protected readonly texts = companyTexts;
  private readonly fb = inject(FormBuilder);

  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      ruleSystemCode: [{ value: '', disabled: false }, [Validators.required, Validators.maxLength(5)]],
      companyCode: [{ value: '', disabled: false }, [Validators.required, Validators.maxLength(30)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      startDate: [{ value: '', disabled: false }, [Validators.required]],
      legalName: ['', [Validators.required, Validators.maxLength(200)]],
      taxIdentifier: ['', [Validators.maxLength(50)]],
      street: ['', [Validators.maxLength(300)]],
      city: ['', [Validators.maxLength(120)]],
      postalCode: ['', [Validators.maxLength(20)]],
      regionCode: ['', [Validators.maxLength(30)]],
      countryCode: ['', [Validators.maxLength(3)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['detail']) {
      this.rebuildForm();
    }
  }

  protected get isEditMode(): boolean {
    return this.mode() === 'edit';
  }

  protected get formTitle(): string {
    return this.isEditMode ? this.texts.formEditTitle : this.texts.formCreateTitle;
  }

  protected get successMessage(): string | null {
    const success = this.submitSuccess();
    if (success === 'created') return this.texts.submitSuccessCreated;
    if (success === 'updated') return this.texts.submitSuccessUpdated;
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.getRawFormValue());
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private rebuildForm(): void {
    const mode = this.mode();
    const detail = this.detail();

    const initialValue =
      mode === 'edit' && detail
        ? this.toFormState(buildCompanyFormValueFromDetail(detail))
        : this.toFormState(buildEmptyCompanyFormValue());

    this.form.reset(initialValue);
    this.form.markAsPristine();
    this.form.markAsUntouched();

    if (mode === 'edit') {
      this.form.get('ruleSystemCode')?.disable();
      this.form.get('companyCode')?.disable();
      this.form.get('startDate')?.disable();
    } else {
      this.form.get('ruleSystemCode')?.enable();
      this.form.get('companyCode')?.enable();
      this.form.get('startDate')?.enable();
    }
  }

  private toFormState(value: CompanyFormValue): Record<string, string | Date | null> {
    return {
      ...value,
      startDate: value.startDate ? this.parseDate(value.startDate) : null,
    };
  }

  private getRawFormValue(): CompanyFormValue {
    const raw = this.form.getRawValue();
    return {
      ruleSystemCode: raw.ruleSystemCode ?? '',
      companyCode: raw.companyCode ?? '',
      name: raw.name ?? '',
      description: raw.description ?? '',
      startDate: raw.startDate instanceof Date ? this.formatDate(raw.startDate) : (raw.startDate ?? ''),
      legalName: raw.legalName ?? '',
      taxIdentifier: raw.taxIdentifier ?? '',
      street: raw.street ?? '',
      city: raw.city ?? '',
      postalCode: raw.postalCode ?? '',
      regionCode: raw.regionCode ?? '',
      countryCode: raw.countryCode ?? '',
    };
  }

  private parseDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
