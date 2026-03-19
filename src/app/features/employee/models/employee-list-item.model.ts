import { EmployeeBusinessKey } from './employee-business-key.model';

export interface EmployeeListItemModel extends EmployeeBusinessKey {
  displayName: string;
  workCenter: string;
  statusLabel: string;
}
