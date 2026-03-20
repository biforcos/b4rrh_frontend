import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { DefaultService } from '../generated/api/default.service';
import {
  EmployeeJourneyResponse,
  JourneyEmployeeHeader,
  JourneyItemResponse,
  JourneyTrackResponse,
} from '../generated/model/models';
import { EmployeeBusinessKeyApiQuery } from './employee-read.client';

export interface EmployeeJourneyApiHeaderModel {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  displayName: string | null;
}

export interface EmployeeJourneyApiTrackItemModel {
  startDate: string;
  endDate: string | null;
  label: string;
  details: Readonly<Record<string, unknown>>;
}

export interface EmployeeJourneyApiTrackModel {
  trackCode: string;
  trackLabel: string;
  items: ReadonlyArray<EmployeeJourneyApiTrackItemModel>;
}

export interface EmployeeJourneyApiModel {
  employee: EmployeeJourneyApiHeaderModel;
  tracks: ReadonlyArray<EmployeeJourneyApiTrackModel>;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeJourneyReadClient {
  private readonly api = inject(DefaultService);

  readEmployeeJourneyByBusinessKey(key: EmployeeBusinessKeyApiQuery): Observable<EmployeeJourneyApiModel> {
    const normalizedKey = this.normalizeKey(key);

    return this.api
      .getEmployeeJourney(normalizedKey)
      .pipe(map((journey) => this.toEmployeeJourneyApiModel(journey)));
  }

  private normalizeKey(key: EmployeeBusinessKeyApiQuery): EmployeeBusinessKeyApiQuery {
    return {
      ruleSystemCode: key.ruleSystemCode.trim(),
      employeeTypeCode: key.employeeTypeCode.trim(),
      employeeNumber: key.employeeNumber.trim(),
    };
  }

  private toEmployeeJourneyApiModel(source: EmployeeJourneyResponse): EmployeeJourneyApiModel {
    return {
      employee: this.toEmployeeJourneyApiHeaderModel(source.employee),
      tracks: source.tracks.map((track) => this.toEmployeeJourneyApiTrackModel(track)),
    };
  }

  private toEmployeeJourneyApiHeaderModel(source: JourneyEmployeeHeader): EmployeeJourneyApiHeaderModel {
    return {
      ruleSystemCode: source.ruleSystemCode,
      employeeTypeCode: source.employeeTypeCode,
      employeeNumber: source.employeeNumber,
      displayName: this.normalizeOptionalString(source.displayName),
    };
  }

  private toEmployeeJourneyApiTrackModel(source: JourneyTrackResponse): EmployeeJourneyApiTrackModel {
    return {
      trackCode: source.trackCode,
      trackLabel: source.trackLabel,
      items: source.items.map((item) => this.toEmployeeJourneyApiTrackItemModel(item)),
    };
  }

  private toEmployeeJourneyApiTrackItemModel(source: JourneyItemResponse): EmployeeJourneyApiTrackItemModel {
    return {
      startDate: source.startDate,
      endDate: this.normalizeOptionalString(source.endDate),
      label: source.label,
      details: this.toReadonlyUnknownRecord(source.details),
    };
  }

  private normalizeOptionalString(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private toReadonlyUnknownRecord(
    value: Record<string, unknown> | null | undefined,
  ): Readonly<Record<string, unknown>> {
    if (!value || typeof value !== 'object') {
      return {};
    }

    return Object.fromEntries(Object.entries(value)) as Readonly<Record<string, unknown>>;
  }
}