import type { Timestamp } from 'firebase/firestore';

/**
 * Formats a date as a localized date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return 'N/A';

  try {
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if ('toDate' in date) {
      // Firestore Timestamp
      dateObj = date.toDate() as Date;
    } else {
      return 'Invalid Date';
    }

    return dateObj.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Formats a date and time as a localized string (e.g., "1/15/2024, 3:45 PM")
 */
export function formatDateTime(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return 'N/A';

  try {
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if ('toDate' in date) {
      // Firestore Timestamp
      dateObj = date.toDate() as Date;
    } else {
      return 'Invalid Date';
    }

    return dateObj.toLocaleString();
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Formats a number with thousands separators (e.g., 1,234)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString();
}

/**
 * Formats gems with proper pluralization (e.g., "5 gems", "1 gem")
 */
export function formatGems(count: number): string {
  const formatted = formatNumber(count);
  return count === 1 ? `${formatted} gem` : `${formatted} gems`;
}
