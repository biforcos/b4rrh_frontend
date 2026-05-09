import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import {
  DISPLAY_NAME_FORMAT_CODES,
  EmployeeDisplayNameFormatClient,
  EmployeeDisplayNameFormatModel,
} from '../../../core/api/clients/employee-display-name-format.client';

@Component({
  selector: 'app-display-name-format-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectModule, ButtonModule, FormsModule],
  templateUrl: './display-name-format-card.component.html',
  styleUrl: './display-name-format-card.component.scss',
})
export class DisplayNameFormatCardComponent implements OnChanges {
  readonly ruleSystemCode = input.required<string>();

  private readonly client = inject(EmployeeDisplayNameFormatClient);

  protected readonly formatOptions = DISPLAY_NAME_FORMAT_CODES.map(f => ({
    label: `${f.label} — ${f.example}`,
    value: f.code,
  }));

  protected readonly currentFormat = signal<EmployeeDisplayNameFormatModel | null>(null);
  protected readonly selectedCode = signal<string>('FULL_TITLE_CASE');
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly saveSuccess = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ruleSystemCode']) {
      this.load();
    }
  }

  protected onFormatChange(value: string): void {
    this.selectedCode.set(value);
  }

  protected save(): void {
    const code = this.selectedCode();
    if (!code) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    this.client.upsert(this.ruleSystemCode(), { formatCode: code }).subscribe({
      next: (result) => {
        this.currentFormat.set(result);
        this.saveSuccess.set(true);
        this.saving.set(false);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saveError.set('No se pudo guardar el formato. Código: ' + err.status);
        this.saving.set(false);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.client.get(this.ruleSystemCode()).subscribe({
      next: (format) => {
        this.currentFormat.set(format);
        this.selectedCode.set(format.formatCode);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.currentFormat.set(null);
          this.selectedCode.set('FULL_TITLE_CASE');
        }
        this.loading.set(false);
      },
    });
  }
}
