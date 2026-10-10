import { type ClassValue, clsx } from 'clsx';

// Lightweight cn utility - clsx only (Tailwind v4 handles merging via CSS layers)
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format an ISO date string to a locale-appropriate display string.
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string to include time.
 */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a confidence value (0..1) as a percentage or 'Unknown'.
 */
export function formatConfidence(confidence: number | null): string {
  if (confidence === null || confidence === undefined) return 'Unknown';
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}
