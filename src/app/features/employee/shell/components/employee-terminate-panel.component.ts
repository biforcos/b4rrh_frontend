import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EmployeeFieldCatalogService } from '../../data-access/employee-field-catalog.service';
import { EmployeeBusinessKey } from '../../models/employee-business-key.model';
import { EmployeeDetailStore } from '../../data-access/employee-detail.store';
import { EmployeeJourneyStore } from '../../data-access/employee-journey.store';
import { EmployeePresenceStore } from '../../data-access/employee-presence.store';
import { EmployeeWorkCenterStore } from '../../data-access/employee-work-center.store';
import { BASE_PATH } from '../../../../core/api/generated/variables';
import { PanelComponent } from '../../../../shared/ui/panel/panel.component';
import { SlotKeyOption } from '../../shared/ui/section/editable-slot-section.model';

@Component({
  selector: 'app-employee-terminate-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel [title]="'Terminate employee'">
      <form [formGroup]="form" (ngSubmit)="submit()" class="employee-terminate__form">
        <label>Termination date</label>
        <input type="date" formControlName="terminationDate" />

        <label>Exit reason</label>
        <select formControlName="exitReasonCode" [attr.aria-busy]="optionsLoading()">
          <option value="" disabled>
            {{ optionsLoading() ? 'Loading exit reasons...' : 'Select an exit reason' }}
          </option>
          <option *ngFor="let opt of options()" [value]="opt.value">{{ opt.label }}</option>
        </select>
        <p *ngIf="!optionsLoading() && options().length === 0" class="employee-terminate__empty">No exit reasons available for this rule system.</p>

        <div class="employee-terminate__actions">
          <button type="button" (click)="cancel()">Cancel</button>
          <button type="submit" [disabled]="submitting() || form.invalid || optionsLoading() || options().length === 0">Terminate</button>
        </div>

        <p *ngIf="errorMsg()" class="employee-terminate__error">{{ errorMsg() }}</p>
      </form>
    </app-panel>
  `,
  styles: [
    '.employee-terminate__form { display:flex; flex-direction:column; gap:8px }',
    '.employee-terminate__actions { display:flex; gap:8px; justify-content:flex-end }',
    '.employee-terminate__error { color: #b00020 }',
  ],
})
export class EmployeeTerminatePanelComponent {
  /** Single required business key input. The panel expects a populated key when opened. */
  readonly employeeKey = input<import('../../models/employee-business-key.model').EmployeeBusinessKey | undefined>(undefined);
  readonly closed = output<void>();

  private readonly http = inject(HttpClient);
  private readonly basePath = inject(BASE_PATH);
  private readonly fieldCatalog = inject(EmployeeFieldCatalogService);
  private readonly detailStore = inject(EmployeeDetailStore);
  private readonly journeyStore = inject(EmployeeJourneyStore);
  private readonly presenceStore = inject(EmployeePresenceStore);
  private readonly workCenterStore = inject(EmployeeWorkCenterStore);

  readonly form = new FormGroup({
    terminationDate: new FormControl('', { nonNullable: true }),
    exitReasonCode: new FormControl('', { nonNullable: true }),
  });

  readonly options = signal<ReadonlyArray<SlotKeyOption<string>>>([]);
  readonly optionsLoading = signal(false);
  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);

  constructor() {
    effect(() => {
      const key = this.employeeKey();
      if (!key) {
        // Panel opened without a valid employee key – reproducible error in dev
        if (isDevMode()) {
          console.error('[TerminatePanel] missing required EmployeeBusinessKey input');
        }
        this.options.set([]);
        return;
      }

      const rs = key.ruleSystemCode;
      if (!rs || rs.trim().length === 0) {
        if (isDevMode()) {
          console.error('[TerminatePanel] employee key provided but ruleSystemCode is missing', key);
        }
        this.options.set([]);
        return;
      }

      // Log once that we received the business key and ruleSystemCode (dev mode)
      if (isDevMode()) {
        console.debug('[TerminatePanel] received employeeKey', key);
        console.debug('[TerminatePanel] using ruleSystemCode', rs);
      }

      this.optionsLoading.set(true);

      const sub = this.fieldCatalog.loadPresenceExitReasonOptions(rs).subscribe({
        next: (opts) => {
          this.options.set(opts);
          this.optionsLoading.set(false);
          if (isDevMode()) {
            console.debug('[TerminatePanel] loaded options', opts.length);
          }
        },
        error: (e) => {
          this.options.set([]);
          this.optionsLoading.set(false);
          if (isDevMode()) {
            console.warn('[TerminatePanel] failed loading exit reasons', e);
          }
        },
      });

      return () => sub.unsubscribe();
    });
  }

  cancel(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    const key = this.employeeKey();
    if (!key) {
      this.errorMsg.set('Missing employee key');
      if (isDevMode()) {
        console.error('[TerminatePanel] submit called without employeeKey');
      }
      return;
    }

    const rs = key.ruleSystemCode;
    const et = key.employeeTypeCode;
    const en = key.employeeNumber;

    const payload = {
      terminationDate: this.form.controls.terminationDate.value,
      exitReasonCode: this.form.controls.exitReasonCode.value,
    };

    this.submitting.set(true);
    this.errorMsg.set(null);

    const url = `${this.basePath}/employees/${encodeURIComponent(rs)}/${encodeURIComponent(et)}/${encodeURIComponent(en)}/terminate`;

    this.http.post(url, payload, { observe: 'response' as const }).subscribe({
      next: () => {
        this.submitting.set(false);
        // refresh stores: detail, journey, presences and work centers
        const key: EmployeeBusinessKey = { ruleSystemCode: rs, employeeTypeCode: et, employeeNumber: en };
        this.detailStore.loadEmployeeDetailByBusinessKey(key);
        this.journeyStore.loadJourneyByBusinessKey(key);
        this.presenceStore.loadPresencesByBusinessKey(key);
        this.workCenterStore.loadWorkCenters(key);
        this.closed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 400) {
          this.errorMsg.set('Invalid request payload');
        } else if (err.status === 404) {
          this.errorMsg.set('Employee or rule system not found');
        } else if (err.status === 409) {
          this.errorMsg.set('Functional conflict preventing termination');
        } else if (err.status === 422) {
          this.errorMsg.set('Business validation failed (invalid exit reason)');
        } else {
          this.errorMsg.set('Request failed');
        }
      },
    });
  }
}
