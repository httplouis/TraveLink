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
  
  // If timestamp doesn't have timezone info, treat it as UTC (not Philippine time)
  // This is because PostgreSQL timestamps without timezone are typically stored as UTC
  let adjustedDateStr = dateStr;
  
  // Check if timestamp has timezone info (Z, +, or -)
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    // Check if it looks like a timestamp (has time component with colons)
    if (dateStr.includes(':') && dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
      // It's a timestamp without timezone - treat as UTC
      adjustedDateStr = dateStr + 'Z';
      console.log('Added UTC timezone, adjusted to:', adjustedDateStr);
    } else {
      // It's just a date - treat as Philippine time
      adjustedDateStr = dateStr + '+08:00';
      console.log('Added Philippine timezone, adjusted to:', adjustedDateStr);
    }
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
  // If timestamp doesn't have timezone info, treat it as UTC (not Philippine time)
  // This is because PostgreSQL timestamps without timezone are typically stored as UTC
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    // Check if it looks like a timestamp (has time component with colons)
    if (dateStr.includes(':') && dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
      // It's a timestamp without timezone - treat as UTC
      adjustedDateStr = dateStr + 'Z';
    } else {
      // It's just a date - treat as Philippine time
      adjustedDateStr = dateStr + '+08:00';
    }
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
 * IMPORTANT: PostgreSQL timestamptz columns are stored in UTC and should already have 'Z' or timezone info
 * However, some columns (like vp_approved_at, president_approved_at) may be stored as TIMESTAMP without timezone
 * In that case, we need to treat them as UTC by converting to ISO format and adding 'Z'
 */
export function formatLongDateTime(dateStr: string): string {
  if (!dateStr) return '';
  
  let adjustedDateStr = dateStr;
  
  // Check if timestamp has timezone info at the END of the string
  // Look for 'Z', '+HH:MM', or '-HH:MM' at the end (timezone offset)
  const hasTimezone = dateStr.endsWith('Z') || 
                      /[+-]\d{2}:?\d{2}$/.test(dateStr) ||
                      /[+-]\d{4}$/.test(dateStr);
  
  // If no timezone info and it looks like a timestamp (has time component with colons), treat as UTC
  if (!hasTimezone && dateStr.includes(':') && dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
    // PostgreSQL TIMESTAMP without timezone stores values as UTC
    // Convert space-separated format to ISO format and add 'Z' for UTC
    // "2025-11-24 10:56:24.62" -> "2025-11-24T10:56:24.62Z"
    adjustedDateStr = dateStr.replace(' ', 'T') + 'Z';
  }
  
  const date = new Date(adjustedDateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('[formatLongDateTime] Invalid date string:', dateStr, 'adjusted:', adjustedDateStr);
    return '';
  }
  
  // Format with Philippine timezone
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
