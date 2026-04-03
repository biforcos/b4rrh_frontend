import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, effect, input, untracked } from '@angular/core';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiDateInputComponent } from '../../../../shared/ui/date-input/ui-date-input.component';
import { EmployeeCostCenterStore } from '../../data-access/employee-cost-center.store';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { employeeTexts } from '../../employee.texts';
import { EmployeeSectionShellComponent } from '../../shared/ui/section/employee-section-shell.component';
import { SectionUiState } from '../../shared/ui/section/section-ui-state.model';
import { EmployeeCostCenterDistributionEditorComponent } from './employee-cost-center-distribution-editor.component';
import { EmployeeCostCenterWindowDisplayComponent } from './employee-cost-center-window-display.component';

export type CostCenterDisplayMode = 'view' | 'manage' | 'creating' | 'replacing' | 'closing';

@Component({
  selector: 'app-employee-cost-center-section',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeSectionShellComponent,
    UiButtonComponent,
    UiDateInputComponent,
    EmployeeCostCenterDistributionEditorComponent,
    EmployeeCostCenterWindowDisplayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-employee-section-shell
      [title]="texts.costCenterSectionTitle"
      [subtitle]="texts.costCenterSectionSubtitle"
      [state]="sectionState()"
    >
      <app-ui-button
        sectionShellHeaderActions
        severity="secondary"
        [outlined]="true"
        size="small"
        [label]="isViewMode() ? texts.workCenterSectionManageAction : texts.workCenterSectionExitManageAction"
        [disabled]="store.loading() || store.mutating()"
        (pressed)="toggleManage()"
      />

      <div class="cost-center-section">
        @if (isViewMode() || isManageMode()) {
          <div class="cost-center-section__content">
            @if (store.currentDistribution(); as current) {
              <div class="cost-center-section__current">
                <h4 class="cost-center-section__label">{{ texts.costCenterSectionCurrentStatus }}</h4>
                <app-employee-cost-center-window-display [window]="current" />

                @if (isManageMode()) {
                  <div class="cost-center-section__manage-actions">
                    <app-ui-button
                      severity="secondary"
                      size="small"
                      [label]="texts.costCenterSectionReplaceAction"
                      (pressed)="startReplace()"
                    />
                    <app-ui-button
                      severity="danger"
                      size="small"
                      [label]="texts.costCenterSectionCloseAction"
                      (pressed)="startClose()"
                    />
                  </div>
                }
              </div>
            } @else if (!store.loading() && (isViewMode() || isManageMode())) {
              <div class="cost-center-section__empty">
                <p>{{ texts.costCenterSectionEmptyMessage }}</p>
                @if (isManageMode()) {
                  <app-ui-button severity="primary" size="small" [label]="texts.costCenterSectionAddAction" (pressed)="startCreate()" />
                }
              </div>
            }

            @if (historicalWindows().length > 0) {
              <div class="cost-center-section__history">
                <h4 class="cost-center-section__history-title">{{ texts.costCenterSectionHistoryTitle }}</h4>
                <div class="cost-center-section__history-list">
                  @for (window of historicalWindows(); track window.startDate) {
                    <app-employee-cost-center-window-display [window]="window" class="cost-center-section__history-item" />
                  }
                </div>
              </div>
            }
          </div>
        }

        @if (isCreating() || isReplacing()) {
          <div class="cost-center-section__editor">
            <app-employee-cost-center-distribution-editor
              #editor
              [dateLabel]="isCreating() ? texts.costCenterSectionStartDateLabel : texts.costCenterSectionEffectiveDateLabel"
              [initialValue]="editorInitialValue()"
            />
            <div class="cost-center-section__form-actions">
              <app-ui-button [label]="texts.costCenterSectionSaveAction" [disabled]="store.mutating()" (pressed)="submitForm()" />
              <app-ui-button severity="secondary" [outlined]="true" [label]="texts.costCenterSectionCancelAction" [disabled]="store.mutating()" (pressed)="cancel()" />
            </div>
          </div>
        }

        @if (isClosing()) {
          <div class="cost-center-section__close-form">
            <p class="cost-center-section__close-hint">{{ texts.costCenterSectionConfirmCloseMessage }}</p>
            <div class="cost-center-section__close-field">
              <label class="cost-center-section__label">{{ texts.costCenterSectionCloseDateLabel }}</label>
              <app-ui-date-input [value]="closeDate()" (valueChanged)="closeDate.set($event)" />
            </div>
            <div class="cost-center-section__form-actions">
              <app-ui-button severity="danger" [label]="texts.costCenterSectionConfirmCloseAction" [disabled]="store.mutating() || !closeDate()" (pressed)="submitClose()" />
              <app-ui-button severity="secondary" [outlined]="true" [label]="texts.costCenterSectionCancelAction" [disabled]="store.mutating()" (pressed)="cancel()" />
            </div>
          </div>
        }
      </div>
    </app-employee-section-shell>
  `,
  styles: [`
    .cost-center-section { display: flex; flex-direction: column; gap: 1.5rem; }
    .cost-center-section__label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-tertiary); margin-bottom: 0.75rem; }
    .cost-center-section__manage-actions { display: flex; gap: 1rem; margin-top: 1rem; padding-left: 1rem; border-left: 2px solid var(--color-primary-100); }
    .cost-center-section__empty { padding: 2rem; text-align: center; color: var(--color-text-tertiary); border: 2px dashed var(--color-border); border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .cost-center-section__history { margin-top: 1rem; }
    .cost-center-section__history-title { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 1rem; text-transform: uppercase; border-bottom: 1px solid var(--color-divider); padding-bottom: 0.5rem; }
    .cost-center-section__history-list { display: flex; flex-direction: column; gap: 1rem; opacity: 0.8; }
    .cost-center-section__history-item { display: block; }
    .cost-center-section__form-actions { display: flex; gap: 1rem; margin-top: 2rem; border-top: 1px solid var(--color-divider); padding-top: 1.5rem; }
    .cost-center-section__close-form { padding: 1.5rem; border: 1px solid var(--color-danger-200); border-radius: 8px; background: var(--color-danger-50); }
    .cost-center-section__close-hint { margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--color-danger-800); }
    .cost-center-section__close-field { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
  `],
})
export class EmployeeCostCenterSectionComponent {
  readonly employeeKey = input<EmployeeBusinessKey | null>(null);
  readonly store = inject(EmployeeCostCenterStore);
  readonly texts = employeeTexts;

  readonly displayMode = signal<CostCenterDisplayMode>('view');
  readonly closeDate = signal<string>('');

  private readonly editor = viewChild(EmployeeCostCenterDistributionEditorComponent);

  protected readonly isViewMode = computed(() => this.displayMode() === 'view');
  protected readonly isManageMode = computed(() => this.displayMode() === 'manage');
  protected readonly isCreating = computed(() => this.displayMode() === 'creating');
  protected readonly isReplacing = computed(() => this.displayMode() === 'replacing');
  protected readonly isClosing = computed(() => this.displayMode() === 'closing');

  protected readonly sectionState = computed<SectionUiState>(() => {
    const isBusy = this.store.loading() || this.store.mutating();
    return {
      mode: isBusy ? 'submitting' : (this.isViewMode() ? 'view' : 'editing'),
      dirty: !this.isViewMode(),
      busy: isBusy,
      errorMessage: this.mapErrorCode(this.store.error()),
      successMessage: this.mapSuccessType(this.store.success()),
    };
  });

  protected readonly historicalWindows = computed(() => {
    const current = this.store.currentDistribution();
    return this.store.history().filter((w) => w.startDate !== current?.startDate);
  });

  protected readonly editorInitialValue = computed(() => {
    if (this.isReplacing()) {
      const current = this.store.currentDistribution();
      return current ? { startDate: '', items: current.items } : null;
    }
    return null;
  });

  constructor() {
    effect(() => {
      const key = this.employeeKey();
      untracked(() => {
        this.store.loadCostCenters(key);
        this.displayMode.set('view');
      });
    });

    // Reset mode on success
    effect(() => {
      if (this.store.success()) {
        this.displayMode.set('view');
      }
    });

    // Reset feedback on mode change
    effect(() => {
      this.displayMode();
      untracked(() => this.store.clearFeedback());
    });
  }

  toggleManage(): void {
    if (this.isViewMode()) {
      this.displayMode.set('manage');
    } else {
      this.displayMode.set('view');
    }
  }

  startCreate(): void {
    this.displayMode.set('creating');
  }

  startReplace(): void {
    this.displayMode.set('replacing');
  }

  startClose(): void {
    const current = this.store.currentDistribution();
    this.closeDate.set(current?.endDate ?? '');
    this.displayMode.set('closing');
  }

  cancel(): void {
    if (this.isCreating() || this.isReplacing() || this.isClosing()) {
      this.displayMode.set('manage');
    } else {
      this.displayMode.set('view');
    }
  }

  submitForm(): void {
    const editor = this.editor();
    if (!editor || !editor.isValid()) return;

    const draft = editor.getValue();
    const key = this.store.selectedEmployeeKey();
    if (!key) return;

    if (this.isCreating()) {
      this.store.createDistribution(key, { startDate: draft.startDate, items: draft.items });
    } else if (this.isReplacing()) {
      this.store.replaceDistribution(key, { effectiveDate: draft.startDate, items: draft.items });
    }
  }

  submitClose(): void {
    const key = this.store.selectedEmployeeKey();
    const current = this.store.currentDistribution();
    if (!key || !current) return;

    this.store.closeDistribution(key, current.startDate, this.closeDate());
  }

  private mapErrorCode(code: string | null): string | null {
    if (!code) return null;
    // Map functional codes to user-friendly messages if needed, otherwise generic text
    switch (code) {
      case 'COST_CENTER_INVALID_WINDOW': return this.texts.costCenterSectionInvalidTotalMessage;
      case 'request-failed': return this.texts.costCenterSectionRequestFailedMessage;
      default: return this.texts.costCenterSectionRequestFailedMessage;
    }
  }

  private mapSuccessType(type: 'created' | 'replaced' | 'closed' | null): string | null {
    if (!type) return null;
    switch (type) {
      case 'created': return this.texts.costCenterSectionCreateSuccessMessage;
      case 'replaced': return this.texts.costCenterSectionReplaceSuccessMessage;
      case 'closed': return this.texts.costCenterSectionCloseSuccessMessage;
    }
  }
}
