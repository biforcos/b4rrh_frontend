import { EmployeeContractModel } from '../models/employee-contract.model';
import { mapContractToTemporalRow } from './employee-contract.mapper';

const rowTexts = {
  activeStatus: 'Vigente',
  closedStatus: 'Historico',
  currentPeriodLabel: 'actual',
  periodPrefix: 'Periodo',
} as const;

describe('mapContractToTemporalRow', () => {
  it('maps current occurrence as correctable/closeable and non-deletable', () => {
    const activeOccurrence: EmployeeContractModel = {
      contractCode: 'CONTRACT-A',
      contractTypeName: 'Contrato A',
      contractSubtypeCode: 'SUB-A',
      contractSubtypeName: 'Subtipo A',
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
    };

    const row = mapContractToTemporalRow(activeOccurrence, rowTexts);

    expect(row.title).toBe('Contrato A · CONTRACT-A');
    expect(row.subtitle).toBe('Subtipo A · SUB-A');
    expect(row.canCorrect).toBe(true);
    expect(row.canClose).toBe(true);
    expect(row.canDelete).toBe(false);
  });

  it('maps historical occurrence as correctable and non-closeable/non-deletable', () => {
    const historicalOccurrence: EmployeeContractModel = {
      contractCode: 'CONTRACT-B',
      contractSubtypeCode: 'SUB-B',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: false,
    };

    const row = mapContractToTemporalRow(historicalOccurrence, rowTexts);

    expect(row.title).toBe('CONTRACT-B');
    expect(row.subtitle).toBe('SUB-B');
    expect(row.canCorrect).toBe(true);
    expect(row.canClose).toBe(false);
    expect(row.canDelete).toBe(false);
  });
});
