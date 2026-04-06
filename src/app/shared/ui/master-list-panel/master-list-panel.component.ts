import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, computed, contentChild, input, output, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';

import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { UiButtonComponent } from '../button/ui-button.component';

export interface MasterListPanelItemContext<T> {
  $implicit: T;
  selected: boolean;
}

@Component({
  selector: 'app-master-list-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, InputTextModule, UiButtonComponent, EmptyStateComponent],
  templateUrl: './master-list-panel.component.html',
  styleUrl: './master-list-panel.component.scss',
})
export class MasterListPanelComponent<T = unknown> {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly items = input.required<ReadonlyArray<T>>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly emptyTitle = input.required<string>();
  readonly emptyDescription = input.required<string>();
  readonly primaryActionLabel = input<string | null>(null);
  readonly primaryActionDisabled = input(false);
  readonly searchPlaceholder = input<string | null>(null);
  readonly selectedKey = input<string | null>(null);
  readonly listAriaLabel = input('Master list');
  readonly keyOf = input.required<(item: T) => string>();
  readonly matchesQuery = input<((item: T, normalizedQuery: string) => boolean) | null>(null);

  readonly primaryAction = output<void>();
  readonly itemSelected = output<T>();

  private readonly itemTemplate = contentChild.required<TemplateRef<MasterListPanelItemContext<T>>>(TemplateRef);
  protected readonly searchQuery = signal('');

  protected readonly filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.items();
    const matcher = this.matchesQuery();

    if (!query || !matcher) {
      return items;
    }

    return items.filter((item) => matcher(item, query));
  });

  protected onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  protected emitPrimaryAction(): void {
    this.primaryAction.emit();
  }

  protected emitItemSelected(item: T): void {
    this.itemSelected.emit(item);
  }

  protected isSelected(item: T): boolean {
    return this.keyOf()(item) === this.selectedKey();
  }

  protected trackByKey = (_index: number, item: T): string => this.keyOf()(item);

  protected resolveItemTemplate(): TemplateRef<MasterListPanelItemContext<T>> {
    return this.itemTemplate();
  }
}