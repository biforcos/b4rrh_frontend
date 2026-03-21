export interface EmployeeJourneyHeaderModel {
  ruleSystemCode: string;
  employeeTypeCode: string;
  employeeNumber: string;
  displayName: string | null;
}

export type EmployeeJourneyEventStatus = 'completed' | 'current' | 'future';

export interface EmployeeJourneyEventModel {
  eventDate: string;
  eventType: string;
  trackCode: string;
  title: string;
  subtitle: string | null;
  status: EmployeeJourneyEventStatus;
  isCurrent: boolean;
  details: Readonly<Record<string, unknown>> | null;
}

export interface EmployeeJourneyModel {
  employee: EmployeeJourneyHeaderModel;
  events: ReadonlyArray<EmployeeJourneyEventModel>;
}