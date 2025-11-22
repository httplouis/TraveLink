/**
 * Pending Requests Alert System
 * Monitors pending requests and provides alerts when threshold is exceeded
 */

export interface PendingAlert {
  count: number;
  threshold: number;
  showAlert: boolean;
  role: 'head' | 'admin' | 'comptroller' | 'hr' | 'vp' | 'president';
}

const ALERT_THRESHOLD = 5; // Show alert when > 5 pending requests

/**
 * Check if pending count exceeds threshold
 */
export function shouldShowPendingAlert(count: number): boolean {
  return count > ALERT_THRESHOLD;
}

/**
 * Get alert severity based on count
 */
export function getAlertSeverity(count: number): 'info' | 'warning' | 'danger' {
  if (count > 15) return 'danger';
  if (count > 10) return 'warning';
  return 'info';
}

/**
 * Format alert message
 */
export function getAlertMessage(count: number, role: string): string {
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);
  if (count > 15) {
    return `⚠️ High Priority: ${count} requests pending ${roleName} review`;
  }
  if (count > 10) {
    return `⚠️ ${count} requests pending ${roleName} review`;
  }
  return `${count} requests pending ${roleName} review`;
}

