import { EmployeeWorkCenterModel } from '../models/employee-work-center.model';
import { mapEmployeeWorkCenterModelToTemporalRow } from './employee-work-center.mapper';

const rowTexts = {
  currentStatus: 'Vigente',
  closedStatus: 'Historica',
  currentPeriodLabel: 'actual',
  periodPrefix: 'Periodo',
  assignmentPrefix: 'Asignacion',
  deleteDisabledPresenceStartReason: 'No se puede eliminar porque inicia una presence del empleado.',
} as const;

describe('mapEmployeeWorkCenterModelToTemporalRow', () => {
  it('allows delete for active occurrence when canDelete is true', () => {
    const source: EmployeeWorkCenterModel = {
      workCenterAssignmentNumber: 10,
      workCenterCode: 'MAD-01',
      workCenterLabel: null,
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
      canDelete: true,
      startsAtPresenceStart: false,
      deleteForbiddenReason: null,
    };

    const row = mapEmployeeWorkCenterModelToTemporalRow(source, rowTexts);

    expect(row.isCurrent).toBe(true);
    expect(row.closeable).toBe(true);
    expect(row.deletable).toBe(true);
    expect(row.deleteDisabledReason).toBeNull();
  });

  it('disables delete with explicit reason when occurrence starts at presence start', () => {
    const source: EmployeeWorkCenterModel = {
      workCenterAssignmentNumber: 11,
      workCenterCode: 'SEV-03',
      workCenterLabel: null,
      startDate: '2025-02-01',
      endDate: null,
      isActive: true,
      canDelete: false,
      startsAtPresenceStart: true,
      deleteForbiddenReason: 'starts-at-presence-start',
    };

    const row = mapEmployeeWorkCenterModelToTemporalRow(source, rowTexts);

    expect(row.deletable).toBe(false);
    expect(row.deleteDisabledReason).toBe(rowTexts.deleteDisabledPresenceStartReason);
  });

  it('allows delete for historical occurrence when canDelete is true', () => {
    const source: EmployeeWorkCenterModel = {
      workCenterAssignmentNumber: 9,
      workCenterCode: 'BCN-02',
      workCenterLabel: null,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: false,
      canDelete: true,
      startsAtPresenceStart: false,
      deleteForbiddenReason: null,
    };

    const row = mapEmployeeWorkCenterModelToTemporalRow(source, rowTexts);

    expect(row.isCurrent).toBe(false);
    expect(row.closeable).toBe(false);
    expect(row.deletable).toBe(true);
  });
});
