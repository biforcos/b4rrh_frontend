import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';

import { EmployeeTaxInformationStore } from '../../data-access/employee-tax-information.store';
import { employeeTexts } from '../../employee.texts';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeSectionShellComponent } from '../../shared/ui/section/employee-section-shell.component';
import { SectionUiState } from '../../shared/ui/section/section-ui-state.model';

@Component({
  selector: 'app-employee-tax-information-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeSectionShellComponent],
  templateUrl: './employee-tax-information-section.component.html',
  styleUrl: './employee-tax-information-section.component.scss',
})
export class EmployeeTaxInformationSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);

  protected readonly store = inject(EmployeeTaxInformationStore);
  protected readonly texts = employeeTexts;

  protected readonly sectionState = computed<SectionUiState>(() => ({
    mode: this.store.loading() || this.store.mutating() ? 'submitting' : 'view',
    dirty: false,
    busy: this.store.loading() || this.store.mutating(),
    errorMessage: this.mapError(this.store.error()),
    successMessage: this.mapSuccess(this.store.success()),
  }));

  constructor() {
    effect(() => {
      const key = this.employeeKey();
      untracked(() => this.store.load(key));
    });
  }

  private mapError(code: string | null): string | null {
    if (code === 'conflict') return 'Ya existe información fiscal para esa fecha.';
    if (code === 'not-found') return 'Información fiscal no encontrada.';
    if (code === 'request-failed') return 'Error al cargar la información fiscal.';
    return null;
  }

  private mapSuccess(code: string | null): string | null {
    if (code === 'created') return 'Información fiscal creada correctamente.';
    if (code === 'corrected') return 'Información fiscal corregida correctamente.';
    if (code === 'deleted') return 'Información fiscal eliminada correctamente.';
    return null;
  }
}
