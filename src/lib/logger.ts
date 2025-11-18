/**
 * Structured logging utility with context support
 *
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Contextual metadata (requestId, userId, clinicId)
 * - Structured output (JSON for production, pretty for development)
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  requestId?: string;
  userId?: number;
  clinicId?: number;
  dentistId?: number;
  patientId?: number;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private context: LogContext = {};
  private minLevel: LogLevel =
    process.env.LOG_LEVEL === 'debug'
      ? LogLevel.DEBUG
      : process.env.NODE_ENV === 'production'
      ? LogLevel.INFO
      : LogLevel.DEBUG;

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    childLogger.minLevel = this.minLevel;
    return childLogger;
  }

  /**
   * Add persistent context to this logger
   */
  addContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (Object.keys(this.context).length > 0 || meta) {
      entry.context = {
        ...this.context,
        ...(typeof meta === 'object' && !meta.stack ? meta : {}),
      };
    }

    if (meta instanceof Error) {
      entry.error = {
        name: meta.name,
        message: meta.message,
        stack: meta.stack,
      };
    } else if (meta?.stack) {
      entry.error = {
        name: meta.name || 'Error',
        message: meta.message || message,
        stack: meta.stack,
      };
    }

    // Pretty print in development, JSON in production
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const levelColor = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      console.log(
        `${levelColor[level]}[${level.toUpperCase()}]${reset} ${entry.timestamp} ${message}`,
        entry.context || '',
        entry.error || ''
      );
    }
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Logger class for creating child loggers
export { Logger };
