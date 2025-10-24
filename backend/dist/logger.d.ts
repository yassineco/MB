import pino from 'pino';
export declare const logger: import("pino").Logger<never>;
export declare function createPerformanceLogger(operation: string): {
    end: (additionalInfo?: Record<string, unknown>) => void;
    error: (error: Error, additionalInfo?: Record<string, unknown>) => void;
};
export declare function createContextLogger(context: Record<string, unknown>): pino.Logger<never>;
export default logger;
//# sourceMappingURL=logger.d.ts.map