import { isValidSpanishDni } from './spanish-dni.util';

describe('isValidSpanishDni', () => {
  it('accepts a valid DNI', () => {
    expect(isValidSpanishDni('12345678Z')).toBe(true);
  });

  it('rejects a DNI with wrong letter', () => {
    expect(isValidSpanishDni('12345678A')).toBe(false);
  });

  it('rejects invalid format', () => {
    expect(isValidSpanishDni('1234A')).toBe(false);
  });

  it('accepts lowercase input by normalizing case', () => {
    expect(isValidSpanishDni('12345678z')).toBe(true);
  });

  it('accepts inputs with spaces by normalizing whitespace', () => {
    expect(isValidSpanishDni(' 1234 5678 z ')).toBe(true);
  });
});
