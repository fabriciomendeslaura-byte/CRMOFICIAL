type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

const isProduction = import.meta.env.PROD;

/**
 * Lightweight logger utility for the application.
 * In development, all logs are shown.
 * In production, only warnings and errors are logged.
 */
class Logger {
    private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
        };
    }

    debug(message: string, context?: Record<string, unknown>): void {
        if (!isProduction) {
            const entry = this.formatMessage('debug', message, context);
            console.debug(`[DEBUG] ${entry.timestamp}:`, message, context || '');
        }
    }

    info(message: string, context?: Record<string, unknown>): void {
        if (!isProduction) {
            const entry = this.formatMessage('info', message, context);
            console.info(`[INFO] ${entry.timestamp}:`, message, context || '');
        }
    }

    warn(message: string, context?: Record<string, unknown>): void {
        const entry = this.formatMessage('warn', message, context);
        console.warn(`[WARN] ${entry.timestamp}:`, message, context || '');

        // In production, you could send this to a logging service
        if (isProduction) {
            this.sendToLoggingService(entry);
        }
    }

    error(message: string, error?: Error, context?: Record<string, unknown>): void {
        const entry = this.formatMessage('error', message, {
            ...context,
            errorName: error?.name,
            errorMessage: error?.message,
            errorStack: error?.stack,
        });
        console.error(`[ERROR] ${entry.timestamp}:`, message, error, context || '');

        // In production, you could send this to a logging service
        if (isProduction) {
            this.sendToLoggingService(entry);
        }
    }

    private sendToLoggingService(_entry: LogEntry): void {
        // Placeholder for sending logs to an external service like Sentry, LogRocket, etc.
        // Example:
        // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
        // For now, this is a no-op. Implement as needed.
    }
}

export const logger = new Logger();
