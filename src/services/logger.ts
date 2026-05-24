// src/services/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: any;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;

    private formatLog(level: LogLevel, message: string, context?: any): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
        };
    }

    info(message: string, context?: any): void {
        const log = this.formatLog('info', message, context);
        console.log(JSON.stringify(log));
    }

    warn(message: string, context?: any): void {
        const log = this.formatLog('warn', message, context);
        console.warn(JSON.stringify(log));
    }

    error(message: string, error?: any): void {
        const log = this.formatLog('error', message, {
            errorMessage: error?.message,
            errorStack: this.isDevelopment ? error?.stack : undefined,
        });
        console.error(JSON.stringify(log));
    }

    debug(message: string, context?: any): void {
        if (this.isDevelopment) {
            const log = this.formatLog('debug', message, context);
            console.debug(JSON.stringify(log));
        }
    }
}

export const logger = new Logger();