export type ExpiryState = 'ok' | 'soon' | 'expired';

// 'YYYY-MM' → конец последнего дня месяца; 'YYYY-MM-DD' → конец дня.
export function expiryEnd(expiry: string): Date {
  const [y, m, d] = expiry.split('-').map(Number);
  return d ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m, 0, 23, 59, 59);
}

export function expiryState(expiry: string | null, leadDays: number): ExpiryState {
  if (!expiry) return 'ok';
  const end = expiryEnd(expiry).getTime();
  const now = Date.now();
  if (end < now) return 'expired';
  if (end < now + leadDays * 86_400_000) return 'soon';
  return 'ok';
}

export function formatExpiry(expiry: string): string {
  const [y, m] = expiry.split('-');
  return `${m}.${y}`;
}
