import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';

export interface UiTabsNavItem {
  value: string;
  label: string;
  routeCommands?: ReadonlyArray<string>;
  disabled?: boolean;
}

@Component({
  selector: 'app-ui-tabs-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TabsModule],
  templateUrl: './ui-tabs-nav.component.html',
  styleUrl: './ui-tabs-nav.component.scss',
})
export class UiTabsNavComponent {
  private readonly router = inject(Router);

  readonly activeValue = input('');
  readonly ariaLabel = input('');
  readonly items = input<ReadonlyArray<UiTabsNavItem>>([]);

  protected navigate(item: UiTabsNavItem): void {
    if (item.disabled || !item.routeCommands || item.routeCommands.length === 0) {
      return;
    }

    void this.router.navigate([...item.routeCommands]);
  }
}
