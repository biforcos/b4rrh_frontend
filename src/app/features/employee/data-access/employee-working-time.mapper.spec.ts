import {
  createEmptyWorkingTimeCloseDraft,
  createEmptyWorkingTimeCreateDraft,
  mapEmployeeWorkingTimeModelToTemporalRow,
  mapWorkingTimeCloseDraftToRequest,
  mapWorkingTimeCreateDraftToRequest,
} from './employee-working-time.mapper';

describe('employee-working-time.mapper', () => {
  it('maps a working time model to a temporal row with derived hours', () => {
    const row = mapEmployeeWorkingTimeModelToTemporalRow(
      {
        workingTimeNumber: 3,
        startDate: '2026-01-01',
        endDate: null,
        workingTimePercentage: 75,
        weeklyHours: 30,
        dailyHours: 6,
        monthlyHours: 125,
        isActive: true,
      },
      {
        activeStatus: 'Vigente',
        closedStatus: 'Historica',
        currentPeriodLabel: 'actual',
        periodPrefix: 'Periodo',
        percentageLabel: 'Porcentaje de jornada',
        weeklyHoursLabel: 'Horas semanales',
        dailyHoursLabel: 'Horas diarias',
        monthlyHoursLabel: 'Horas mensuales',
      },
    );

    expect(row.key).toBe(3);
    expect(row.title).toBe('Porcentaje de jornada: 75 %');
    expect(row.titleSecondary).toBe('#3');
    expect(row.subtitle).toContain('Horas semanales: 30');
    expect(row.subtitle).toContain('Horas diarias: 6');
    expect(row.detailText).toBe('Horas mensuales: 125');
    expect(row.closeable).toBe(true);
  });

  it('maps create draft to canonical request without derived hours', () => {
    const request = mapWorkingTimeCreateDraftToRequest({
      startDate: '2026-04-01',
      workingTimePercentage: 80,
    });

    expect(request).toEqual({
      startDate: '2026-04-01',
      workingTimePercentage: 80,
    });
    expect('weeklyHours' in request).toBe(false);
    expect('dailyHours' in request).toBe(false);
    expect('monthlyHours' in request).toBe(false);
  });

  it('provides empty drafts for create and close', () => {
    expect(createEmptyWorkingTimeCreateDraft()).toEqual({
      startDate: '',
      workingTimePercentage: 0,
    });
    expect(mapWorkingTimeCloseDraftToRequest(createEmptyWorkingTimeCloseDraft())).toEqual({
      endDate: '',
    });
  });
});