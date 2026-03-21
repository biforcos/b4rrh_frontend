import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, take } from 'rxjs';

import { CatalogGateway } from '../gateway/catalog.gateway';
import { CreateRuleEntityRequestModel } from '../models/create-rule-entity.request';
import { RuleEntityModel } from '../models/rule-entity.model';
import { RuleEntityTypeModel } from '../models/rule-entity-type.model';
import { RuleSystemModel } from '../models/rule-system.model';
import { catalogTexts } from '../catalog.texts';

@Injectable({
  providedIn: 'root',
})
export class CatalogStore {
  private readonly gateway = inject(CatalogGateway);

  private readonly ruleSystemsState = signal<ReadonlyArray<RuleSystemModel>>([]);
  private readonly selectedRuleSystemCodeState = signal<string | null>(null);
  private readonly ruleEntityTypesState = signal<ReadonlyArray<RuleEntityTypeModel>>([]);
  private readonly selectedRuleEntityTypeCodeState = signal<string | null>(null);
  private readonly ruleEntitiesState = signal<ReadonlyArray<RuleEntityModel>>([]);
  private readonly loadingRuleSystemsState = signal(false);
  private readonly loadingRuleEntityTypesState = signal(false);
  private readonly loadingRuleEntitiesState = signal(false);
  private readonly creatingState = signal(false);
  private readonly errorMessageState = signal<string | null>(null);
  private readonly successMessageState = signal<string | null>(null);
  private readonly createResetTokenState = signal(0);
  private listRequestId = 0;

  readonly ruleSystems = this.ruleSystemsState.asReadonly();
  readonly selectedRuleSystemCode = this.selectedRuleSystemCodeState.asReadonly();
  readonly ruleEntityTypes = this.ruleEntityTypesState.asReadonly();
  readonly selectedRuleEntityTypeCode = this.selectedRuleEntityTypeCodeState.asReadonly();
  readonly ruleEntities = this.ruleEntitiesState.asReadonly();
  readonly loadingRuleSystems = this.loadingRuleSystemsState.asReadonly();
  readonly loadingRuleEntityTypes = this.loadingRuleEntityTypesState.asReadonly();
  readonly loadingRuleEntities = this.loadingRuleEntitiesState.asReadonly();
  readonly creating = this.creatingState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();
  readonly successMessage = this.successMessageState.asReadonly();
  readonly createResetToken = this.createResetTokenState.asReadonly();

  initialize(): void {
    this.loadingRuleSystemsState.set(true);
    this.loadingRuleEntityTypesState.set(true);
    this.errorMessageState.set(null);

    forkJoin({
      ruleSystems: this.gateway.loadRuleSystems(),
      ruleEntityTypes: this.gateway.loadRuleEntityTypes(),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ ruleSystems, ruleEntityTypes }) => {
          this.loadingRuleSystemsState.set(false);
          this.loadingRuleEntityTypesState.set(false);
          this.ruleSystemsState.set(ruleSystems);
          this.ruleEntityTypesState.set(ruleEntityTypes);

          if (!this.selectedRuleSystemCodeState() && ruleSystems.length > 0) {
            this.selectedRuleSystemCodeState.set(ruleSystems[0].code);
          }

          if (!this.selectedRuleEntityTypeCodeState() && ruleEntityTypes.length > 0) {
            this.selectedRuleEntityTypeCodeState.set(ruleEntityTypes[0].code);
          }

          this.loadRuleEntitiesForCurrentContext();
        },
        error: (error: unknown) => {
          this.loadingRuleSystemsState.set(false);
          this.loadingRuleEntityTypesState.set(false);
          this.errorMessageState.set(this.formatError(error));
        },
      });
  }

  selectRuleSystem(code: string): void {
    const normalizedCode = code.trim();
    this.selectedRuleSystemCodeState.set(normalizedCode.length > 0 ? normalizedCode : null);
    this.successMessageState.set(null);
    this.errorMessageState.set(null);
    this.loadRuleEntitiesForCurrentContext();
  }

  selectRuleEntityType(code: string): void {
    const normalizedCode = code.trim();
    this.selectedRuleEntityTypeCodeState.set(normalizedCode.length > 0 ? normalizedCode : null);
    this.successMessageState.set(null);
    this.errorMessageState.set(null);
    this.loadRuleEntitiesForCurrentContext();
  }

  createRuleEntity(request: CreateRuleEntityRequestModel): void {
    if (this.creatingState()) {
      return;
    }

    this.creatingState.set(true);
    this.errorMessageState.set(null);
    this.successMessageState.set(null);

    this.gateway
      .createRuleEntity(request)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.creatingState.set(false);
          this.successMessageState.set(catalogTexts.createSuccessMessage);
          this.createResetTokenState.update((value) => value + 1);
          this.loadRuleEntitiesForCurrentContext();
        },
        error: (error: unknown) => {
          this.creatingState.set(false);
          this.errorMessageState.set(this.formatError(error));
        },
      });
  }

  clearFeedback(): void {
    this.errorMessageState.set(null);
    this.successMessageState.set(null);
  }

  private loadRuleEntitiesForCurrentContext(): void {
    const ruleSystemCode = this.selectedRuleSystemCodeState();
    const ruleEntityTypeCode = this.selectedRuleEntityTypeCodeState();

    if (!ruleSystemCode || !ruleEntityTypeCode) {
      this.ruleEntitiesState.set([]);
      this.loadingRuleEntitiesState.set(false);
      return;
    }

    this.loadingRuleEntitiesState.set(true);
    this.errorMessageState.set(null);

    const requestId = ++this.listRequestId;

    this.gateway
      .loadRuleEntities(ruleSystemCode, ruleEntityTypeCode)
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          if (requestId !== this.listRequestId) {
            return;
          }

          this.loadingRuleEntitiesState.set(false);
          this.ruleEntitiesState.set(items);
        },
        error: (error: unknown) => {
          if (requestId !== this.listRequestId) {
            return;
          }

          this.loadingRuleEntitiesState.set(false);
          this.errorMessageState.set(this.formatError(error));
        },
      });
  }

  private formatError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'object' && error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }

      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      return catalogTexts.genericErrorMessage;
    }

    return catalogTexts.genericErrorMessage;
  }
}
