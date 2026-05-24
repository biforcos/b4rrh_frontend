import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const GRADIENTS: [string, string][] = [
  ['#6366f1', '#818cf8'],
  ['#ec4899', '#f43f5e'],
  ['#f59e0b', '#ef4444'],
  ['#10b981', '#0ea5e9'],
  ['#8b5cf6', '#6366f1'],
  ['#f43f5e', '#fb923c'],
  ['#0ea5e9', '#6366f1'],
  ['#a78bfa', '#c084fc'],
];

function gradientForInitials(initials: string): string {
  const sum = initials.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const [from, to] = GRADIENTS[sum % GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

@Component({
  selector: 'app-avatar-gradient',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="avatar"
      [class.avatar--sm]="size() === 'sm'"
      [class.avatar--md]="size() === 'md'"
      [class.avatar--lg]="size() === 'lg'"
      [style.background]="photoUrl() ? null : gradient()"
    >
      @if (photoUrl()) {
        <img class="avatar__photo" [src]="photoUrl()" alt="" aria-hidden="true" />
      } @else {
        <span class="avatar__initials">{{ initials() }}</span>
      }
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .avatar--sm { width: 28px; height: 28px; }
    .avatar--md { width: 36px; height: 36px; }
    .avatar--lg { width: 44px; height: 44px; }

    .avatar__initials {
      color: #ffffff;
      font-weight: 700;
      line-height: 1;
      user-select: none;
      font-size: 12px;
    }
    .avatar--sm .avatar__initials { font-size: 10px; }
    .avatar--lg .avatar__initials { font-size: 15px; }

    .avatar__photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `],
})
export class AvatarGradientComponent {
  initials = input.required<string>();
  photoUrl = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly gradient = computed(() => gradientForInitials(this.initials()));
}
