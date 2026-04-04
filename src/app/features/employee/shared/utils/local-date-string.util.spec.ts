import { formatLocalDate } from './local-date-string.util';

describe('formatLocalDate', () => {
  it('formats a selected local day as YYYY-MM-DD', () => {
    const selectedDate = new Date(2027, 0, 1);

    expect(formatLocalDate(selectedDate)).toBe('2027-01-01');
  });
});
