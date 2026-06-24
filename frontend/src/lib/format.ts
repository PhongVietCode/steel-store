const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatVnd(amount: number | bigint | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return VND.format(amount);
}

const NUM = new Intl.NumberFormat('vi-VN');
export function formatNumber(n: number | bigint | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return NUM.format(n);
}
