import { Pipe, PipeTransform } from '@angular/core';

/** Formatting only: shifts decimal digits without binary floating-point conversion. */
export function formatDecimal(value: string | number | null | undefined, millions = false): string {
  if (value === null || value === undefined || value === '') return 'Неизвестно';
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return String(value);
  let whole = match[2];
  let fraction = match[3] ?? '';
  if (millions) {
    const digits = whole.padStart(7, '0');
    fraction = digits.slice(-6) + fraction;
    whole = digits.slice(0, -6);
  }
  fraction = fraction.replace(/0+$/, '');
  return (
    match[1] +
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') +
    (fraction ? ',' + fraction : millions ? ',0' : '')
  );
}
@Pipe({ name: 'decimal' })
export class DecimalPipe implements PipeTransform {
  transform(value: string | number | null | undefined, millions = false): string {
    return formatDecimal(value, millions);
  }
}

export const criterionNames: Record<string, string> = {
  revenueShare: 'Доля выручки',
  margin: 'Маржинальность',
  salesGrowth: 'Потенциал роста',
  load: 'Загрузка',
  productionType: 'Тип производства',
  labor: 'Трудоёмкость',
};
