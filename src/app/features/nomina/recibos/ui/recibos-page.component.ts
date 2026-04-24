import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RecibosListComponent } from './recibos-list.component';
import { RecibosDetailComponent } from './recibos-detail.component';

@Component({
  selector: 'app-recibos-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RecibosListComponent, RecibosDetailComponent],
  template: `
    <div class="page-layout">
      <app-recibos-list />
      <app-recibos-detail />
    </div>
  `,
  styles: [`
    .page-layout { display: flex; height: 100%; overflow: hidden; font-family: 'Segoe UI', sans-serif; font-size: 12px; }
  `],
})
export class RecibosPageComponent {}
