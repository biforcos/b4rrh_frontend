export interface PeriodTableRow {
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  canEdit?: boolean;    // default true — show edit button
  canDelete?: boolean;  // default false — show delete button (only for !isActive rows)
}
