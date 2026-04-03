import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BackendUnavailableComponent } from './core/availability/backend-unavailable.component';
import { BackendAvailabilityStore } from './core/availability/backend-availability.store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, BackendUnavailableComponent],
  template: `
    @if (availability.status() === 'available') {
      <router-outlet />
    } @else if (availability.status() === 'unavailable') {
      <app-backend-unavailable />
    }
  `,
})
export class App implements OnInit {
  protected readonly availability = inject(BackendAvailabilityStore);

  ngOnInit(): void {
    this.availability.check();
  }
}
