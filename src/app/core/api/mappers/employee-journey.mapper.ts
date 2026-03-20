import {
  EmployeeJourneyApiHeaderModel,
  EmployeeJourneyApiModel,
  EmployeeJourneyApiTrackItemModel,
  EmployeeJourneyApiTrackModel,
} from '../clients/employee-journey-read.client';

export interface EmployeeJourneyReadHeaderModel {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  displayName: string | null;
}

export interface EmployeeJourneyReadTrackItemModel {
  startDate: string;
  endDate: string | null;
  label: string;
  details: Readonly<Record<string, unknown>>;
  isCurrent: boolean;
}

export interface EmployeeJourneyReadTrackModel {
  code: string;
  label: string;
  items: ReadonlyArray<EmployeeJourneyReadTrackItemModel>;
}

export interface EmployeeJourneyReadModel {
  employee: EmployeeJourneyReadHeaderModel;
  tracks: ReadonlyArray<EmployeeJourneyReadTrackModel>;
}

export function mapEmployeeJourneyApiToReadModel(
  source: EmployeeJourneyApiModel,
): EmployeeJourneyReadModel | null {
  const employee = mapEmployeeJourneyHeaderApiToReadModel(source.employee);
  if (!employee) {
    return null;
  }

  const tracks = source.tracks
    .map((track) => mapEmployeeJourneyTrackApiToReadModel(track))
    .filter((track): track is EmployeeJourneyReadTrackModel => track !== null)
    .sort((left, right) => compareJourneyTrackRecency(left, right));

  return {
    employee,
    tracks,
  };
}

function mapEmployeeJourneyHeaderApiToReadModel(
  source: EmployeeJourneyApiHeaderModel,
): EmployeeJourneyReadHeaderModel | null {
  const ruleSystemCode = source.ruleSystemCode.trim();
  const employeeTypeCode = source.employeeTypeCode.trim();
  const employeeNumber = source.employeeNumber.trim();

  if (!ruleSystemCode || !employeeTypeCode || !employeeNumber) {
    return null;
  }

  return {
    ruleSystemCode,
    employeeTypeCode,
    employeeNumber,
    displayName: normalizeOptionalString(source.displayName),
  };
}

function mapEmployeeJourneyTrackApiToReadModel(
  source: EmployeeJourneyApiTrackModel,
): EmployeeJourneyReadTrackModel | null {
  const code = source.trackCode.trim();
  const label = source.trackLabel.trim();

  if (!code || !label) {
    return null;
  }

  const items = source.items
    .map((item) => mapEmployeeJourneyTrackItemApiToReadModel(item))
    .filter((item): item is EmployeeJourneyReadTrackItemModel => item !== null)
    .sort((left, right) => compareJourneyItemRecency(left, right));

  if (items.length === 0) {
    return null;
  }

  return {
    code,
    label,
    items,
  };
}

function mapEmployeeJourneyTrackItemApiToReadModel(
  source: EmployeeJourneyApiTrackItemModel,
): EmployeeJourneyReadTrackItemModel | null {
  const startDate = source.startDate.trim();
  const label = source.label.trim();

  if (!startDate || !label) {
    return null;
  }

  const endDate = normalizeOptionalString(source.endDate);

  return {
    startDate,
    endDate,
    label,
    details: normalizeDetails(source.details),
    isCurrent: endDate === null,
  };
}

function compareJourneyTrackRecency(
  left: EmployeeJourneyReadTrackModel,
  right: EmployeeJourneyReadTrackModel,
): number {
  const leftMostRecentItem = left.items[0];
  const rightMostRecentItem = right.items[0];

  const eventRecencyOrder = compareJourneyItemRecency(leftMostRecentItem, rightMostRecentItem);
  if (eventRecencyOrder !== 0) {
    return eventRecencyOrder;
  }

  return left.label.localeCompare(right.label);
}

function compareJourneyItemRecency(
  left: EmployeeJourneyReadTrackItemModel,
  right: EmployeeJourneyReadTrackItemModel,
): number {
  const startDateOrder = right.startDate.localeCompare(left.startDate);
  if (startDateOrder !== 0) {
    return startDateOrder;
  }

  const leftEndDate = left.endDate ?? '9999-12-31';
  const rightEndDate = right.endDate ?? '9999-12-31';
  const endDateOrder = rightEndDate.localeCompare(leftEndDate);
  if (endDateOrder !== 0) {
    return endDateOrder;
  }

  return left.label.localeCompare(right.label);
}

function normalizeDetails(value: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  const entries = Object.entries(value)
    .map(([key, entryValue]) => [key.trim(), entryValue] as const)
    .filter(([key]) => key.length > 0);

  return Object.fromEntries(entries) as Readonly<Record<string, unknown>>;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
}