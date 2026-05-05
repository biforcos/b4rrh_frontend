import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';

import { OperacionesGateway } from '../gateway/operaciones.gateway';
import { BulkInvalidateResult } from '../models/bulk-invalidate-result.model';
import { CalculationRun, isRunFinished } from '../models/calculation-run.model';
import { TargetSelectionMode, buildTargetSelectionPayload } from '../models/target-selection.model';

function currentPeriod(): number {
  const now = new Date();
  return now.getFullYear() * 100 + now.getMonth() + 1;
}

function formatPeriod(period: number): string {
  const month = period % 100;
  const year = Math.floor(period / 100);
  const names = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  return `${names[month - 1]} ${year}`;
}

function movePeriod(period: number, delta: 1 | -1): number {
  const month = period % 100;
  const year = Math.floor(period / 100);
  if (delta === -1) return month === 1 ? (year - 1) * 100 + 12 : period - 1;
  return month === 12 ? (year + 1) * 100 + 1 : period + 1;
}

@Injectable({ providedIn: 'root' })
export class OperacionesStore implements OnDestroy {
  private readonly gateway = inject(OperacionesGateway);

  private readonly ruleSystemCodeState = signal<string>('ESP');
  private readonly periodState = signal<number>(currentPeriod());
  private readonly payrollTypeCodeState = signal<'NORMAL' | 'EXTRA'>('NORMAL');
  private readonly targetModeState = signal<TargetSelectionMode>('ALL');
  private readonly employeeListTextState = signal<string>('');
  private readonly singleEmployeeTypeState = signal<string>('');
  private readonly singleEmployeeNumberState = signal<string>('');

  private readonly statusReasonCodeState = signal<string>('RECALCULO');
  private readonly invalidatingState = signal<boolean>(false);
  private readonly invalidateResultState = signal<BulkInvalidateResult | null>(null);
  private readonly invalidateErrorState = signal<string | null>(null);

  private readonly engineCodeState = signal<string>('GRAPH');
  private readonly engineVersionState = signal<string>('1.0');
  private readonly launchingState = signal<boolean>(false);
  private readonly runState = signal<CalculationRun | null>(null);
  private readonly launchErrorState = signal<string | null>(null);
  private pollSubscription: Subscription | null = null;

  readonly payrollTypeOptions = [
    { value: 'NORMAL' as const, label: 'Normal' },
    { value: 'EXTRA' as const, label: 'Extra' },
  ];

  readonly ruleSystemCode = this.ruleSystemCodeState.asReadonly();
  readonly period = this.periodState.asReadonly();
  readonly payrollTypeCode = this.payrollTypeCodeState.asReadonly();
  readonly targetMode = this.targetModeState.asReadonly();
  readonly employeeListText = this.employeeListTextState.asReadonly();
  readonly singleEmployeeType = this.singleEmployeeTypeState.asReadonly();
  readonly singleEmployeeNumber = this.singleEmployeeNumberState.asReadonly();
  readonly statusReasonCode = this.statusReasonCodeState.asReadonly();
  readonly invalidating = this.invalidatingState.asReadonly();
  readonly invalidateResult = this.invalidateResultState.asReadonly();
  readonly invalidateError = this.invalidateErrorState.asReadonly();
  readonly engineCode = this.engineCodeState.asReadonly();
  readonly engineVersion = this.engineVersionState.asReadonly();
  readonly launching = this.launchingState.asReadonly();
  readonly run = this.runState.asReadonly();
  readonly launchError = this.launchErrorState.asReadonly();

  readonly periodLabel = computed(() => formatPeriod(this.periodState()));
  readonly isRunActive = computed(() => {
    const r = this.runState();
    return r !== null && !isRunFinished(r);
  });
  readonly runProgress = computed(() => {
    const r = this.runState();
    if (!r || r.totalEligible === 0) return 0;
    return Math.round(((r.totalCalculated + r.totalErrors) / r.totalEligible) * 100);
  });
  readonly canInvalidate = computed(
    () =>
      !this.invalidatingState() &&
      !this.launchingState() &&
      this.ruleSystemCodeState().trim().length > 0 &&
      this.payrollTypeCodeState().trim().length > 0,
  );
  readonly canLaunch = computed(
    () =>
      !this.invalidatingState() &&
      !this.launchingState() &&
      this.ruleSystemCodeState().trim().length > 0 &&
      this.payrollTypeCodeState().trim().length > 0 &&
      this.engineCodeState().trim().length > 0 &&
      this.engineVersionState().trim().length > 0,
  );

  setRuleSystemCode(v: string): void {
    this.ruleSystemCodeState.set(v);
  }
  setPayrollTypeCode(v: 'NORMAL' | 'EXTRA'): void {
    this.payrollTypeCodeState.set(v);
  }
  setTargetMode(v: TargetSelectionMode): void {
    this.targetModeState.set(v);
  }
  setEmployeeListText(v: string): void {
    this.employeeListTextState.set(v);
  }
  setSingleEmployeeType(v: string): void {
    this.singleEmployeeTypeState.set(v);
  }
  setSingleEmployeeNumber(v: string): void {
    this.singleEmployeeNumberState.set(v);
  }
  setStatusReasonCode(v: string): void {
    this.statusReasonCodeState.set(v);
  }
  setEngineCode(v: string): void {
    this.engineCodeState.set(v);
  }
  setEngineVersion(v: string): void {
    this.engineVersionState.set(v);
  }
  prevPeriod(): void {
    this.periodState.update((p) => movePeriod(p, -1));
  }
  nextPeriod(): void {
    this.periodState.update((p) => movePeriod(p, 1));
  }

  invalidate(): void {
    if (!this.canInvalidate()) return;
    this.invalidatingState.set(true);
    this.invalidateResultState.set(null);
    this.invalidateErrorState.set(null);
    this.gateway
      .bulkInvalidate({
        ruleSystemCode: this.ruleSystemCodeState(),
        payrollPeriodCode: String(this.periodState()),
        payrollTypeCode: this.payrollTypeCodeState(),
        statusReasonCode: this.statusReasonCodeState(),
        targetSelection: buildTargetSelectionPayload(
          this.targetModeState(),
          this.employeeListTextState(),
          this.singleEmployeeTypeState(),
          this.singleEmployeeNumberState(),
        ),
      })
      .subscribe({
        next: (result) => {
          this.invalidatingState.set(false);
          this.invalidateResultState.set(result);
        },
        error: () => {
          this.invalidatingState.set(false);
          this.invalidateErrorState.set('request-failed');
        },
      });
  }

  launch(): void {
    if (!this.canLaunch()) return;
    this.stopPolling();
    this.launchingState.set(true);
    this.runState.set(null);
    this.launchErrorState.set(null);
    this.gateway
      .launchCalculation({
        ruleSystemCode: this.ruleSystemCodeState(),
        payrollPeriodCode: String(this.periodState()),
        payrollTypeCode: this.payrollTypeCodeState(),
        calculationEngineCode: this.engineCodeState(),
        calculationEngineVersion: this.engineVersionState(),
        targetSelection: buildTargetSelectionPayload(
          this.targetModeState(),
          this.employeeListTextState(),
          this.singleEmployeeTypeState(),
          this.singleEmployeeNumberState(),
        ),
      })
      .subscribe({
        next: (run) => {
          this.launchingState.set(false);
          this.runState.set(run);
          if (!isRunFinished(run)) {
            this.startPolling(run.runId);
          }
        },
        error: () => {
          this.launchingState.set(false);
          this.launchErrorState.set('launch-failed');
        },
      });
  }

  private startPolling(runId: number): void {
    this.pollSubscription = interval(3000)
      .pipe(
        switchMap(() => this.gateway.getCalculationRun(runId)),
        takeWhile((run) => !isRunFinished(run), true),
      )
      .subscribe({
        next: (run) => this.runState.set(run),
        error: () => this.launchErrorState.set('poll-failed'),
      });
  }

  private stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
