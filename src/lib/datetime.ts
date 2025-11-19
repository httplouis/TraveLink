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
  console.log('formatPhilippineDate called with:', dateStr);
  
  // If timestamp doesn't have timezone info, treat it as Philippine time
  let adjustedDateStr = dateStr;
  
  // Check if timestamp has timezone info (Z, +, or -)
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    // No timezone info - treat as Philippine time by adding +08:00
    adjustedDateStr = dateStr + '+08:00';
    console.log('Added timezone, adjusted to:', adjustedDateStr);
  }
  
  const date = new Date(adjustedDateStr);
  console.log('Date object created:', date);
  
  const result = date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  console.log('Final formatted result:', result);
  return result;
}

/**
 * Format date to long format: "Tuesday, November 13, 2025"
 */
export function formatLongDate(dateStr: string): string {
  if (!dateStr) return '';
  
  let adjustedDateStr = dateStr;
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    adjustedDateStr = dateStr + '+08:00';
  }
  
  const date = new Date(adjustedDateStr);
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date and time: "November 13, 2025, 2:41 PM"
 */
export function formatLongDateTime(dateStr: string): string {
  if (!dateStr) return '';
  
  let adjustedDateStr = dateStr;
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    adjustedDateStr = dateStr + '+08:00';
  }
  
  const date = new Date(adjustedDateStr);
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
