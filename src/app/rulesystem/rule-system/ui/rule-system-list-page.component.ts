import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiTagComponent } from '../../../shared/ui/tag/ui-tag.component';
import { RuleSystemStore } from '../store/rule-system.store';
import { ruleSystemTexts } from '../rule-system.texts';

@Component({
  selector: 'app-rule-system-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiTagComponent],
  templateUrl: './rule-system-list-page.component.html',
  styleUrl: './rule-system-list-page.component.scss',
})
export class RuleSystemListPageComponent {
  private readonly router = inject(Router);
  private readonly store = inject(RuleSystemStore);

  protected readonly texts = ruleSystemTexts;
  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;

  constructor() {
    this.store.loadList();
  }

  protected openCreate(): void {
    this.store.clearMessages();
    void this.router.navigate(['/configuracion/rule-systems/new']);
  }

  protected openDetail(code: string): void {
    this.store.clearMessages();
    void this.router.navigate(['/configuracion/rule-systems', code]);
  }
}
