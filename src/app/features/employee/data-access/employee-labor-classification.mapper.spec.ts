import { EmployeeLaborClassificationModel } from '../models/employee-labor-classification.model';
import { mapLaborClassificationToTemporalRow } from './employee-labor-classification.mapper';

const rowTexts = {
  activeStatus: 'Vigente',
  closedStatus: 'Historica',
  currentPeriodLabel: 'actual',
  periodPrefix: 'Periodo',
} as const;

describe('mapLaborClassificationToTemporalRow', () => {
  it('maps current occurrence as closeable and non-deletable', () => {
    const activeOccurrence: EmployeeLaborClassificationModel = {
      agreementCode: 'AGREEMENT-A',
      agreementName: null,
      agreementCategoryCode: 'CAT-A',
      agreementCategoryName: null,
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
    };

    const row = mapLaborClassificationToTemporalRow(activeOccurrence, rowTexts);

    expect(row.isCurrent).toBe(true);
    expect(row.closeable).toBe(true);
    expect(row.deletable).toBe(false);
    expect(row.periodText).toBe('2025-01-01 - actual');
    expect(row.title).toBe('AGREEMENT-A');
    expect(row.titleSecondary).toBeNull();
    expect(row.detailText).toBe('CAT-A');
    expect(row.detailSecondary).toBeNull();
  });

  it('maps historical occurrence as not closeable and non-deletable', () => {
    const historicalOccurrence: EmployeeLaborClassificationModel = {
      agreementCode: 'AGREEMENT-A',
      agreementName: null,
      agreementCategoryCode: 'CAT-B',
      agreementCategoryName: null,
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

  it('shows agreement and category names as primary with code as secondary when both labels are present', () => {
    const occurrence: EmployeeLaborClassificationModel = {
      agreementCode: 'AGR-01',
      agreementName: 'Convenio Tecnico',
      agreementCategoryCode: 'CAT-02',
      agreementCategoryName: 'Tecnico Nivel 2',
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
    };

    const row = mapLaborClassificationToTemporalRow(occurrence, rowTexts);

    expect(row.title).toBe('Convenio Tecnico');
    expect(row.titleSecondary).toBe('AGR-01');
    expect(row.detailText).toBe('Tecnico Nivel 2');
    expect(row.detailSecondary).toBe('CAT-02');
  });

  it('falls back to category code when category label is missing and keeps agreement label', () => {
    const occurrence: EmployeeLaborClassificationModel = {
      agreementCode: 'AGR-01',
      agreementName: 'Convenio Tecnico',
      agreementCategoryCode: 'CAT-02',
      agreementCategoryName: null,
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
    };

    const row = mapLaborClassificationToTemporalRow(occurrence, rowTexts);

    expect(row.title).toBe('Convenio Tecnico');
    expect(row.titleSecondary).toBe('AGR-01');
    expect(row.detailText).toBe('CAT-02');
    expect(row.detailSecondary).toBeNull();
  });
});
