import { mapEmployeeCoreIdentityDraftToUpdateRequest } from './employee-detail-edit.mapper';

describe('mapEmployeeCoreIdentityDraftToUpdateRequest', () => {
  it('maps all required fields trimmed', () => {
    const result = mapEmployeeCoreIdentityDraftToUpdateRequest({
      firstName: '  Juan  ',
      lastName1: '  García  ',
      lastName2: '',
      preferredName: '',
    });

    expect(result.firstName).toBe('Juan');
    expect(result.lastName1).toBe('García');
  });

  it('maps optional lastName2 when provided', () => {
    const result = mapEmployeeCoreIdentityDraftToUpdateRequest({
      firstName: 'Juan',
      lastName1: 'García',
      lastName2: '  López  ',
      preferredName: '',
    });

    expect(result.lastName2).toBe('López');
  });

  it('normalizes empty lastName2 to null', () => {
    const result = mapEmployeeCoreIdentityDraftToUpdateRequest({
      firstName: 'Juan',
      lastName1: 'García',
      lastName2: '   ',
      preferredName: '',
    });

    expect(result.lastName2).toBeNull();
  });

  it('normalizes empty preferredName to null', () => {
    const result = mapEmployeeCoreIdentityDraftToUpdateRequest({
      firstName: 'Juan',
      lastName1: 'García',
      lastName2: '',
      preferredName: '',
    });

    expect(result.preferredName).toBeNull();
  });

  it('maps preferredName when provided', () => {
    const result = mapEmployeeCoreIdentityDraftToUpdateRequest({
      firstName: 'Juan',
      lastName1: 'García',
      lastName2: '',
      preferredName: '  Juanito  ',
    });

    expect(result.preferredName).toBe('Juanito');
  });
});
