import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { UiTagComponent } from '../tag/ui-tag.component';

export interface EntityHeaderMetadataItem {
  label: string;
  value: string;
}

export interface EntityHeaderStatus {
  label: string;
  severity?: 'success' | 'warn' | 'secondary' | 'contrast';
}

@Component({
  selector: 'app-entity-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiTagComponent],
  templateUrl: './entity-header.component.html',
  styleUrl: './entity-header.component.scss',
})
export class EntityHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  readonly metadata = input<ReadonlyArray<EntityHeaderMetadataItem>>([]);
  readonly status = input<EntityHeaderStatus | null>(null);
  readonly avatarText = input<string | null>(null);

  protected readonly hasMetadata = computed(() => this.metadata().length > 0);
}
