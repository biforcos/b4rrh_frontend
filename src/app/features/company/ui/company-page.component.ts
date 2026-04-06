import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { companyTexts } from '../company.texts';
import { CompanyStore } from '../store/company.store';
import { CompanyBusinessKey } from '../models/company-ui-state.model';
import { CompanyFormValue } from '../models/company-form-value.model';
import { CompanyListComponent } from './company-list.component';
import { CompanyFormComponent } from './company-form.component';

@Component({
  selector: 'app-company-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ButtonModule, CompanyListComponent, CompanyFormComponent],
  templateUrl: './company-page.component.html',
  styleUrl: './company-page.component.scss',
})
export class CompanyPageComponent {
  protected readonly store = inject(CompanyStore);
  protected readonly texts = companyTexts;

  protected onNewCompany(): void {
    this.store.startCreate();
  }

  protected onEditRequested(key: CompanyBusinessKey): void {
    this.store.startEdit(key);
  }

  protected onFormSubmit(formValue: CompanyFormValue): void {
    const key = this.store.selectedKey();

    if (this.store.isCreating()) {
      this.store.submitCreate(formValue);
    } else if (key) {
      this.store.submitUpdate(key, formValue);
    }
  }

  protected onFormCancel(): void {
    this.store.cancelForm();
  }

  protected get formMode(): 'create' | 'edit' {
    return this.store.isCreating() ? 'create' : 'edit';
  }
}
