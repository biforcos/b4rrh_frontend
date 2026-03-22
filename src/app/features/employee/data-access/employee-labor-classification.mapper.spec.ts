import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';
import { mapLaborClassificationToTemporalRow } from './employee-labor-classification.mapper';

const rowTexts = {
  activeStatus: 'Vigente',
  closedStatus: 'Historica',
  currentPeriodLabel: 'actual',
  periodPrefix: 'Periodo',
  categoryPrefix: 'Categoria',
} as const;

describe('mapLaborClassificationToTemporalRow', () => {
  it('maps current occurrence as closeable and non-deletable', () => {
    const activeOccurrence: EmployeeLaborClassificationModel = {
      agreementCode: 'AGREEMENT-A',
      agreementCategoryCode: 'CAT-A',
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
    };

    const row = mapLaborClassificationToTemporalRow(activeOccurrence, rowTexts);

    expect(row.isCurrent).toBe(true);
    expect(row.closeable).toBe(true);
    expect(row.deletable).toBe(false);
    expect(row.periodText).toBe('2025-01-01 - actual');
  });

  it('maps historical occurrence as not closeable and non-deletable', () => {
    const historicalOccurrence: EmployeeLaborClassificationModel = {
      agreementCode: 'AGREEMENT-A',
      agreementCategoryCode: 'CAT-B',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: false,
    };

    const row = mapLaborClassificationToTemporalRow(historicalOccurrence, rowTexts);

    expect(row.isCurrent).toBe(false);
    expect(row.closeable).toBe(false);
    expect(row.deletable).toBe(false);
    expect(row.periodText).toBe('2024-01-01 - 2024-12-31');
  });
});
