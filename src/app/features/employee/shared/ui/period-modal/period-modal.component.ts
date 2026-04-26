import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-period-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule],
  templateUrl: './period-modal.component.html',
  styleUrl: './period-modal.component.scss',
})
export class PeriodModalComponent {
  readonly title = input('');
  readonly subtitle = input<string | null>(null);
  readonly visible = input(false);
  readonly saving = input(false);
  readonly submitEnabled = input(true);
  readonly submitLabel = input('Guardar cambios');
  readonly showCloseAction = input(false);
  readonly closeActionLabel = input('Cerrar período');

  readonly visibleChange = output<boolean>();
  readonly submitted = output<void>();
  readonly cancelled = output<void>();
  readonly closeActionClicked = output<void>();

  onSubmit(): void {
    if (!this.saving() && this.submitEnabled()) this.submitted.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.visibleChange.emit(false);
  }

  onHide(): void { this.onCancel(); }
  onCloseAction(): void { this.closeActionClicked.emit(); }
}
