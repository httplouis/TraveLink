/**
 * Debug logging utility with [PREFIX] format
 * Ensures consistent logging throughout the application
 */

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface LogContext {
  prefix: string;
  component?: string;
  action?: string;
  data?: any;
}

/**
 * Create a debug logger with consistent [PREFIX] format
 */
export function createLogger(prefix: string) {
  return {
    log: (message: string, data?: any) => {
      console.log(`[${prefix}] ${message}`, data || "");
    },
    info: (message: string, data?: any) => {
      console.info(`[${prefix}] ℹ️ ${message}`, data || "");
    },
    warn: (message: string, data?: any) => {
      console.warn(`[${prefix}] ⚠️ ${message}`, data || "");
    },
    error: (message: string, error?: any) => {
      console.error(`[${prefix}] ❌ ${message}`, error || "");
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[${prefix}] 🔍 ${message}`, data || "");
      }
    },
    success: (message: string, data?: any) => {
      console.log(`[${prefix}] ✅ ${message}`, data || "");
    },
  };
}

/**
 * Log API request/response
 */
export function logAPI(prefix: string, method: string, endpoint: string, data?: any) {
  const logger = createLogger(prefix);
  logger.debug(`${method} ${endpoint}`, data);
}

/**
 * Log component lifecycle
 */
export function logComponent(component: string, action: "mount" | "unmount" | "update", props?: any) {
  const logger = createLogger(`Component:${component}`);
  logger.debug(`${action}`, props);
}

/**
 * Log state changes
 */
export function logState(prefix: string, stateName: string, oldValue: any, newValue: any) {
  const logger = createLogger(prefix);
  logger.debug(`State change: ${stateName}`, { old: oldValue, new: newValue });
}

/**
 * Log performance metrics
 */
export function logPerformance(prefix: string, operation: string, duration: number, metadata?: any) {
  const logger = createLogger(prefix);
  logger.debug(`Performance: ${operation} took ${duration}ms`, metadata);
}

/**
 * Log user actions
 */
export function logUserAction(prefix: string, action: string, details?: any) {
  const logger = createLogger(prefix);
  logger.info(`User action: ${action}`, details);
}

/**
 * Log errors with full context
 */
export function logError(prefix: string, message: string, error: any, context?: any) {
  const logger = createLogger(prefix);
  logger.error(message, {
    error: {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    },
    context,
  });
}


