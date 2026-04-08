import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { employeeTexts } from '../../employee.texts';
import { GlobalMessageSummary, GlobalUiMessage, GlobalUiMessageLevel } from '../../models/global-ui-message.model';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiTagComponent } from '../../../../shared/ui/tag/ui-tag.component';

@Component({
  selector: 'app-global-message-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, UiButtonComponent, UiTagComponent],
  animations: [
    trigger('overlayMotion', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate3d(12px, -8px, 0)' }),
        animate('200ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translate3d(0, 0, 0)' })),
      ]),
      transition(':leave', [
        animate('160ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translate3d(12px, -8px, 0)' })),
      ]),
    ]),
    trigger('detailMessageMotion', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate3d(8px, -4px, 0)' }),
        animate('190ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translate3d(0, 0, 0)' })),
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translate3d(8px, -6px, 0)' })),
      ]),
    ]),
  ],
  template: `
    @if (shouldRenderRail()) {
      <p-card
        @overlayMotion
        [styleClass]="railClass()"
        [class.global-message-rail--compact]="isCompactToast()"
        [class.global-message-rail--expanded]="expanded()"
        [attr.aria-label]="texts.globalMessageRailAriaLabel"
      >
        @if (autoDismissDurationMs(); as autoDismissDurationMs) {
          <div
            class="global-message-rail__countdown"
            [style.animation-duration.ms]="autoDismissDurationMs"
            aria-hidden="true"
          ></div>
        }

        <div class="global-message-rail__summary">
          <div class="global-message-rail__summary-main">
            <div class="global-message-rail__summary-icon-shell">
              <i class="global-message-rail__summary-icon pi" [class]="resolveIconClass(summary().dominantLevel)"></i>
            </div>
            <div class="global-message-rail__summary-copy">
              @if (!isCompactToast()) {
                <p class="global-message-rail__summary-title">{{ summaryEyebrow() }}</p>
              }
              <p class="global-message-rail__summary-text">{{ buildSummaryText(summary()) }}</p>
            </div>
          </div>

          <div class="global-message-rail__summary-actions">
            @if (shouldShowInlineAction() && primaryMessage(); as primaryMessage) {
              <app-ui-button
                [label]="texts.globalMessageRailGoToSectionAction"
                severity="secondary"
                [outlined]="true"
                size="small"
                [icon]="'pi pi-arrow-right'"
                (pressed)="sectionRequested.emit(primaryMessage)"
              />
            }

            @if (shouldShowTags() && summary().errorCount > 0) {
              <app-ui-tag [value]="buildCountText(summary().errorCount, 'error')" severity="danger" />
            }
            @if (shouldShowTags() && summary().warningCount > 0) {
              <app-ui-tag [value]="buildCountText(summary().warningCount, 'warning')" severity="warn" />
            }
            @if (shouldShowTags() && summary().successCount > 0) {
              <app-ui-tag [value]="buildCountText(summary().successCount, 'success')" severity="success" />
            }
            @if (shouldShowTags() && summary().infoCount > 0) {
              <app-ui-tag [value]="buildCountText(summary().infoCount, 'info')" severity="info" />
            }

            @if (canExpand()) {
              <button
                pButton
                type="button"
                class="global-message-rail__icon-action"
                [text]="true"
                [rounded]="true"
                [icon]="expanded() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                [attr.aria-label]="expanded() ? texts.globalMessageRailCollapseAction : texts.globalMessageRailExpandAction"
                [attr.title]="expanded() ? texts.globalMessageRailCollapseAction : texts.globalMessageRailExpandAction"
                (click)="toggleRequested.emit()"
              ></button>
            }
            @if (shouldShowCloseAction()) {
              <button
                pButton
                type="button"
                class="global-message-rail__icon-action global-message-rail__icon-action--close"
                [text]="true"
                [rounded]="true"
                icon="pi pi-times"
                [attr.aria-label]="texts.globalMessageRailCloseDetailAction"
                [attr.title]="texts.globalMessageRailCloseDetailAction"
                (click)="closeRequested.emit()"
              ></button>
            }
          </div>
        </div>

        @if (expanded() && shouldRenderDetail()) {
          <div class="global-message-rail__detail">
            @for (message of visibleDetailMessages(); track message.id) {
              <article @detailMessageMotion class="global-message-rail__message" [attr.data-level]="message.level">
                <div class="global-message-rail__message-copy">
                  <p class="global-message-rail__message-text">{{ message.text }}</p>
                  @if (message.sectionLabel) {
                    <p class="global-message-rail__message-section">{{ message.sectionLabel }}</p>
                  }
                </div>

                @if (message.sectionId) {
                  <app-ui-button
                    [label]="texts.globalMessageRailGoToSectionAction"
                    severity="secondary"
                    [outlined]="true"
                    size="small"
                    [icon]="'pi pi-arrow-right'"
                    (pressed)="sectionRequested.emit(message)"
                  />
                }
              </article>
            }

            @if (hiddenMessageCount() > 0) {
              <p class="global-message-rail__overflow-note">{{ buildAdditionalMessagesText(hiddenMessageCount()) }}</p>
            }
          </div>
        }
      </p-card>
    }
  `,
  styles: [
    ':host { display: block; }',
    ':host ::ng-deep .global-message-rail.p-card { position: relative; border-radius: 0.92rem; border: 1px solid rgba(205, 218, 231, 0.92); border-left-width: 0.28rem; box-shadow: 0 16px 32px -26px rgba(15, 23, 42, 0.26), 0 8px 18px -18px rgba(15, 23, 42, 0.16); backdrop-filter: blur(14px); overflow: hidden; }',
    ':host ::ng-deep .global-message-rail .p-card-body { padding: 0.68rem 0.78rem 0.72rem; }',
    ':host ::ng-deep .global-message-rail--compact.p-card { border-radius: 0.9rem; }',
    ':host ::ng-deep .global-message-rail--error.p-card { background: linear-gradient(180deg, rgba(255, 251, 251, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%); border-left-color: #dc2626; }',
    ':host ::ng-deep .global-message-rail--warning.p-card { background: linear-gradient(180deg, rgba(255, 251, 243, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%); border-left-color: #d97706; }',
    ':host ::ng-deep .global-message-rail--success.p-card { background: linear-gradient(180deg, rgba(245, 252, 247, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%); border-left-color: #16a34a; }',
    ':host ::ng-deep .global-message-rail--info.p-card { background: linear-gradient(180deg, rgba(245, 250, 255, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%); border-left-color: #0284c7; }',
    '.global-message-rail__countdown { position:absolute; inset:0 auto auto 0; width:100%; height:0.14rem; background:linear-gradient(90deg, rgba(22, 163, 74, 0.85) 0%, rgba(52, 211, 153, 0.45) 100%); transform-origin:left center; animation: global-message-rail-countdown linear forwards; }',
    '.global-message-rail--info .global-message-rail__countdown { background:linear-gradient(90deg, rgba(2, 132, 199, 0.82) 0%, rgba(56, 189, 248, 0.38) 100%); }',
    '.global-message-rail__summary { display:flex; align-items:center; justify-content:space-between; gap:0.58rem; }',
    '.global-message-rail__summary-main { display:flex; align-items:center; gap:0.58rem; min-width:0; flex:1 1 auto; }',
    '.global-message-rail__summary-icon-shell { display:grid; place-items:center; width:1.78rem; height:1.78rem; border-radius:999px; background:rgba(255,255,255,0.78); box-shadow: inset 0 0 0 1px rgba(148,163,184,0.12); flex:0 0 auto; }',
    '.global-message-rail--compact .global-message-rail__summary-icon-shell { width:1.65rem; height:1.65rem; }',
    '.global-message-rail__summary-icon { font-size: 0.88rem; color: #334155; }',
    '.global-message-rail--error .global-message-rail__summary-icon { color:#b91c1c; }',
    '.global-message-rail--warning .global-message-rail__summary-icon { color:#b45309; }',
    '.global-message-rail--success .global-message-rail__summary-icon { color:#15803d; }',
    '.global-message-rail--info .global-message-rail__summary-icon { color:#0369a1; }',
    '.global-message-rail__summary-copy { min-width:0; }',
    '.global-message-rail__summary-title { margin:0; font-size:0.63rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#607286; }',
    '.global-message-rail__summary-text { margin:0.08rem 0 0; font-size:0.83rem; line-height:1.25; font-weight:650; color:#172533; }',
    '.global-message-rail--compact .global-message-rail__summary-text { margin-top:0; font-size:0.8rem; font-weight:600; }',
    '.global-message-rail__summary-actions { display:flex; align-items:center; gap:0.22rem; flex-wrap:nowrap; justify-content:flex-end; flex:0 0 auto; }',
    '.global-message-rail__icon-action { color:#4a6074; width:1.85rem; height:1.85rem; }',
    '.global-message-rail__icon-action--close { color:#667b8f; }',
    '.global-message-rail__detail { margin-top:0.44rem; display:flex; flex-direction:column; gap:0.38rem; max-height:12rem; overflow:auto; }',
    '.global-message-rail__message { display:flex; align-items:center; justify-content:space-between; gap:0.62rem; padding:0.28rem 0; background:transparent; }',
    '.global-message-rail__message + .global-message-rail__message { border-top:1px solid rgba(226,235,243,0.62); }',
    '.global-message-rail__message-copy { min-width:0; flex:1 1 auto; }',
    '.global-message-rail__message-text { margin:0; font-size:0.79rem; font-weight:600; line-height:1.28; color:#22384a; }',
    '.global-message-rail__message-section { margin:0.14rem 0 0; font-size:0.71rem; color:#5d738a; }',
    '.global-message-rail__overflow-note { margin:0.08rem 0 0; font-size:0.72rem; font-weight:700; color:#5d738a; }',
    '@keyframes global-message-rail-countdown { from { transform: scaleX(1); opacity: 1; } to { transform: scaleX(0); opacity: 0.45; } }',
    '@media (max-width: 720px) { .global-message-rail__summary, .global-message-rail__message { align-items:flex-start; } .global-message-rail__message { flex-direction:column; } .global-message-rail__summary-actions { justify-content:flex-start; flex-wrap:wrap; } .global-message-rail__detail { max-height:10rem; } }',
  ],
})
export class GlobalMessageRailComponent {
  private static readonly MAX_VISIBLE_DETAIL_MESSAGES = 3;

  readonly messages = input<ReadonlyArray<GlobalUiMessage>>([]);
  readonly summary = input<GlobalMessageSummary>({
    total: 0,
    errorCount: 0,
    warningCount: 0,
    successCount: 0,
    infoCount: 0,
    dominantLevel: null,
  });
  readonly expanded = input(false);

  readonly toggleRequested = output<void>();
  readonly closeRequested = output<void>();
  readonly sectionRequested = output<GlobalUiMessage>();

  protected readonly texts = employeeTexts;
  protected readonly railClass = computed(() => `global-message-rail global-message-rail--${this.summary().dominantLevel ?? 'info'}`);
  protected readonly primaryMessage = computed(() => this.messages()[0] ?? null);
  protected readonly hasBlockingMessages = computed(() => {
    const summary = this.summary();
    return summary.errorCount > 0 || summary.warningCount > 0;
  });
  protected readonly shouldRenderRail = computed(() => this.summary().total > 0 && (!this.hasBlockingMessages() || this.expanded()));
  protected readonly isCompactToast = computed(() => {
    const summary = this.summary();
    return summary.total === 1 && summary.errorCount === 0 && summary.warningCount === 0;
  });
  protected readonly visibleDetailMessages = computed(() =>
    this.messages().slice(0, GlobalMessageRailComponent.MAX_VISIBLE_DETAIL_MESSAGES),
  );
  protected readonly hiddenMessageCount = computed(() =>
    Math.max(this.messages().length - this.visibleDetailMessages().length, 0),
  );
  protected readonly shouldRenderDetail = computed(() => this.messages().length > 1);
  protected readonly canExpand = computed(() => this.shouldRenderDetail());
  protected readonly shouldShowInlineAction = computed(() => !this.shouldRenderDetail() && !!this.primaryMessage()?.sectionId);
  protected readonly shouldShowCloseAction = computed(() => this.expanded() || this.isCompactToast());
  protected readonly shouldShowTags = computed(() => !this.isCompactToast() && this.summary().total > 1);
  protected readonly autoDismissDurationMs = computed(() => this.primaryMessage()?.dismissAfterMs ?? null);
  protected readonly summaryEyebrow = computed(() => {
    const summary = this.summary();
    if (summary.errorCount > 0) {
      return this.texts.globalMessageRailErrorsEyebrow;
    }
    if (summary.warningCount > 0) {
      return this.texts.globalMessageRailWarningsEyebrow;
    }
    if (summary.successCount > 0) {
      return this.texts.globalMessageRailSuccessEyebrow;
    }
    return this.texts.globalMessageRailInfoEyebrow;
  });

  protected buildSummaryText(summary: GlobalMessageSummary): string {
    const railMessages = this.messages();
    if (railMessages.length === 1) {
      return railMessages[0].text;
    }

    if (summary.errorCount > 0 && summary.warningCount === 0 && summary.successCount === 0 && summary.infoCount === 0) {
      return `${summary.errorCount} ${summary.errorCount === 1 ? this.texts.globalMessageRailErrorSingular : this.texts.globalMessageRailErrorPlural} en la ficha`;
    }

    if (summary.warningCount > 0 && summary.errorCount === 0 && summary.successCount === 0 && summary.infoCount === 0) {
      return `${summary.warningCount} ${summary.warningCount === 1 ? this.texts.globalMessageRailWarningSingular : this.texts.globalMessageRailWarningPlural} en la ficha`;
    }

    return [
      summary.errorCount > 0 ? this.buildCountText(summary.errorCount, 'error') : null,
      summary.warningCount > 0 ? this.buildCountText(summary.warningCount, 'warning') : null,
      summary.successCount > 0 ? this.buildCountText(summary.successCount, 'success') : null,
      summary.infoCount > 0 ? this.buildCountText(summary.infoCount, 'info') : null,
    ].filter((value): value is string => value !== null).join(' · ');
  }

  protected buildCountText(count: number, level: GlobalUiMessageLevel): string {
    if (level === 'error') {
      return `${count} ${count === 1 ? this.texts.globalMessageRailErrorSingular : this.texts.globalMessageRailErrorPlural}`;
    }

    if (level === 'warning') {
      return `${count} ${count === 1 ? this.texts.globalMessageRailWarningSingular : this.texts.globalMessageRailWarningPlural}`;
    }

    if (level === 'success') {
      return `${count} ${count === 1 ? this.texts.globalMessageRailSuccessSingular : this.texts.globalMessageRailSuccessPlural}`;
    }

    return `${count} ${count === 1 ? this.texts.globalMessageRailInfoSingular : this.texts.globalMessageRailInfoPlural}`;
  }

  protected buildAdditionalMessagesText(count: number): string {
    return `${count} ${count === 1 ? this.texts.globalMessageRailAdditionalMessageSingular : this.texts.globalMessageRailAdditionalMessagePlural}`;
  }

  protected resolveIconClass(level: GlobalUiMessageLevel | null): string {
    if (level === 'error') {
      return 'pi-exclamation-circle';
    }

    if (level === 'warning') {
      return 'pi-exclamation-triangle';
    }

    if (level === 'success') {
      return 'pi-check-circle';
    }

    return 'pi-info-circle';
  }
}