import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function money(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function toMoneyString(value: Decimal): string {
  return value.toFixed(4);
}

export function toDisplayMoney(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(2);
}
