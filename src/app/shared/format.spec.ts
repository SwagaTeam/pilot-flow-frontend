import { formatDecimal } from './format';
describe('Exact decimal presentation', () => {
  it('preserves all digits beyond JavaScript safe integer precision', () => {
    expect(formatDecimal('999999999999999999.123456')).toBe(
      '999\u00a0999\u00a0999\u00a0999\u00a0999\u00a0999,123456',
    );
    expect(formatDecimal('999999999999999999.123456', true)).toBe(
      '999\u00a0999\u00a0999\u00a0999,999999123456',
    );
  });
  it('distinguishes missing values from actual zero', () => {
    expect(formatDecimal(null)).toBe('Неизвестно');
    expect(formatDecimal('0')).toBe('0');
    expect(formatDecimal('0', true)).toBe('0,0');
  });
  it('formats fractional and negative values without rounding business data', () => {
    expect(formatDecimal('90', true)).toBe('0,00009');
    expect(formatDecimal('-1234567.120000')).toBe('-1\u00a0234\u00a0567,12');
  });
});
