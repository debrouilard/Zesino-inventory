export function formatMoney(value: string | number) {
  const amount = typeof value === 'number' ? value : Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactMoney(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

export function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
