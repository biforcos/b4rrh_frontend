export interface EmployeeJourneyHeaderModel {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  displayName: string | null;
}

export interface EmployeeJourneyTrackItemModel {
  startDate: string;
  endDate: string | null;
  label: string;
  details: Readonly<Record<string, unknown>>;
  isCurrent: boolean;
}

export interface EmployeeJourneyTrackModel {
  code: string;
  label: string;
  items: ReadonlyArray<EmployeeJourneyTrackItemModel>;
}

export interface EmployeeJourneyModel {
  employee: EmployeeJourneyHeaderModel;
  tracks: ReadonlyArray<EmployeeJourneyTrackModel>;
}