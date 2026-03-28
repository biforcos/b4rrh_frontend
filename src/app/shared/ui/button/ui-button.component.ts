import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

type UiButtonType = 'button' | 'submit' | 'reset';
type UiButtonSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'danger'
  | 'help'
  | 'primary'
  | 'secondary'
  | 'contrast'
  | undefined
  | null;
type UiButtonSize = 'small' | 'large' | undefined;
type UiButtonIconPosition = 'left' | 'right' | 'top' | 'bottom';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  templateUrl: './ui-button.component.html',
  styleUrl: './ui-button.component.scss',
  host: {
    '[class.app-ui-button--fluid]': 'fluid()',
  },
})
export class UiButtonComponent {
  readonly label = input.required<string>();
  readonly type = input<UiButtonType>('button');
  readonly severity = input<UiButtonSeverity>(undefined);
  readonly size = input<UiButtonSize>(undefined);
  readonly outlined = input(false);
  readonly text = input(false);
  readonly rounded = input(false);
  readonly icon = input<string | undefined>(undefined);
  readonly iconPos = input<UiButtonIconPosition>('left');
  readonly disabled = input(false);
  readonly fluid = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly pressed = output<MouseEvent>();

  protected emitPressed(event: MouseEvent): void {
    this.pressed.emit(event);
  }
}
