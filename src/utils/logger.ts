/**
 * Logger utility that only logs in development mode.
 * In production, logs are suppressed to reduce bundle size and improve performance.
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]): void => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

/**
 * Logs an error with context for better debugging.
 * Always logs in production since errors are important.
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

/**
 * Logs info only in development.
 */
export function logInfo(context: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.info(`[${context}]`, ...args);
  }
}
