/**
 * Get current timestamp in Philippine Time (UTC+8)
 * Returns ISO string format compatible with PostgreSQL timestamptz
 */
export function getPhilippineTimestamp(): string {
  // Simply return current time - PostgreSQL will store it correctly
  // The display formatting will handle timezone conversion
  return new Date().toISOString();
}

/**
 * Format date to Philippine Time for display
 */
export function formatPhilippineDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
