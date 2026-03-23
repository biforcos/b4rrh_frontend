const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function isValidSpanishDni(value: string): boolean {
  const normalizedValue = value.replace(/\s+/g, '').toUpperCase();

  if (!/^\d{8}[A-Z]$/.test(normalizedValue)) {
    return false;
  }

  const dniNumber = Number(normalizedValue.slice(0, 8));
  const expectedLetter = DNI_LETTERS[dniNumber % 23];
  const receivedLetter = normalizedValue[8];

  return receivedLetter === expectedLetter;
}
