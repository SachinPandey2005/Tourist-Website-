export type ClassValue = string | number | boolean | undefined | null;

/**
 * Conditionally joins class names together into a clean class string.
 */
export function cn(...classes: (ClassValue | ClassValue[])[]): string {
  return classes.flat().filter(Boolean).join(' ');
}

/**
 * Formats a monetary amount into a clean currency string.
 */
export function formatCurrency(amount: number | string, currency = 'USD'): string {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Formats an ISO date string into a readable format.
 */
export function formatDate(date: string | Date): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}
