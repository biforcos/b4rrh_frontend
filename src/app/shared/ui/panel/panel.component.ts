import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
})
export class PanelComponent {
  readonly title = input('');
  readonly subtitle = input('');
}
