"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createPerformanceLogger = createPerformanceLogger;
exports.createContextLogger = createContextLogger;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("@/config/env");
// Configuration du logger avec Pino
const loggerConfig = {
    level: env_1.config.LOG_LEVEL,
    // Configuration pour différents environnements
    ...(env_1.config.NODE_ENV === 'development' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
    }),
    // Production: JSON structuré pour Cloud Logging
    ...(env_1.config.NODE_ENV === 'production' && {
        formatters: {
            level: (label) => ({ severity: label.toUpperCase() }),
            log: (object) => ({
                ...object,
                // Ajouter des métadonnées GCP
                project: env_1.config.PROJECT_ID,
                service: 'magic-button-api',
                version: process.env.npm_package_version || '1.0.0',
            }),
        },
    }),
    // Redaction pour éviter de logger des données sensibles
    redact: {
        paths: [
            'password',
            'token',
            'secret',
            'key',
            'authorization',
            'cookie',
            'headers.authorization',
            'headers.cookie',
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
    },
    // Serializers personnalisés
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            headers: {
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type'],
                'x-forwarded-for': req.headers['x-forwarded-for'],
            },
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
            headers: {
                'content-type': res.headers?.['content-type'],
            },
        }),
        err: pino_1.default.stdSerializers.err,
    },
};
// Création de l'instance logger
exports.logger = (0, pino_1.default)(loggerConfig);
// Helper pour logger les performances
function createPerformanceLogger(operation) {
    const start = process.hrtime.bigint();
    return {
        end: (additionalInfo) => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
            exports.logger.info({
                operation,
                duration: `${duration.toFixed(2)}ms`,
                ...additionalInfo,
            }, `${operation} completed`);
        },
        error: (error, additionalInfo) => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1_000_000;
            exports.logger.error({
                operation,
                duration: `${duration.toFixed(2)}ms`,
                error: error.message,
                stack: error.stack,
                ...additionalInfo,
            }, `${operation} failed`);
        },
    };
}
// Helper pour créer un logger enfant avec contexte
function createContextLogger(context) {
    return exports.logger.child(context);
}
// Export du logger par défaut
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map