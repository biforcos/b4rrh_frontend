import {
  mapEmployeeContactApiToSlotRow,
  mapEmployeeContactModelToSlotRow,
} from './employee-contact-edit.mapper';

describe('employee-contact-edit.mapper', () => {
  it('renders Name · CODE semantics when contactTypeName is present', () => {
    const row = mapEmployeeContactApiToSlotRow({
      contactTypeCode: 'EMAIL',
      contactTypeName: 'Correo electronico',
      contactValue: 'john@b4rrhh.local',
    });

    expect(row.keyLabel).toBe('Correo electronico');
    expect(row.secondaryText).toBe('EMAIL');
    expect(row.value).toBe('john@b4rrhh.local');
  });

  it('falls back to code when contactTypeName is missing', () => {
    const row = mapEmployeeContactApiToSlotRow({
      contactTypeCode: 'MOBILE',
      contactTypeName: null,
      contactValue: '+34 600000001',
    });

    expect(row.keyLabel).toBe('MOBILE');
    expect(row.secondaryText).toBeUndefined();
  });

  it('maps model rows using the same catalog-display behavior', () => {
    const row = mapEmployeeContactModelToSlotRow({
      contactTypeCode: 'EMAIL',
      contactTypeName: 'Correo electronico',
      contactValue: 'john@b4rrhh.local',
      type: 'email',
      label: 'EMAIL',
      value: 'john@b4rrhh.local',
    });

    expect(row.key).toBe('EMAIL');
    expect(row.keyLabel).toBe('Correo electronico');
    expect(row.secondaryText).toBe('EMAIL');
  });
});
