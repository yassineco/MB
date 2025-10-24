"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.startServer = startServer;
const fastify_1 = __importDefault(require("fastify"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
const env_1 = require("@/config/env");
const logger_1 = require("@/logger");
const sign_1 = require("@/services/security/sign");
const genai_1 = require("@/routes/genai");
const knowledge_1 = require("@/routes/knowledge");
async function createServer() {
    const server = (0, fastify_1.default)({
        logger: logger_1.logger,
        trustProxy: true,
        bodyLimit: 10 * 1024 * 1024, // 10MB pour uploads
    });
    // Security middleware
    await server.register(helmet_1.default, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    });
    // Configuration CORS
    await server.register(cors_1.default, {
        origin: (origin, callback) => {
            // En production, limiter aux domaines autorisés
            if (env_1.config.NODE_ENV === 'development') {
                callback(null, true);
                return;
            }
            // Liste des origins autorisées (extensions Chrome)
            const allowedOrigins = [
                'chrome-extension://*',
                // Ajouter autres origins si nécessaire
            ];
            if (!origin || allowedOrigins.some(pattern => origin.match(pattern.replace('*', '.*')))) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'x-mb-timestamp', 'x-mb-signature'],
    });
    // Security middleware pour validation HMAC
    server.addHook('preHandler', async (request, reply) => {
        // Skip validation pour routes de santé
        if (request.url === '/health' || request.url === '/') {
            return;
        }
        // Validation signature HMAC
        const isValid = await (0, sign_1.validateSignature)(request);
        if (!isValid) {
            reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid signature'
            });
            return;
        }
    });
    // Routes
    await server.register(genai_1.genaiRoutes, { prefix: '/api/genai' });
    await server.register(knowledge_1.knowledgeRoutes, { prefix: '/api/knowledge' });
    // Health check
    server.get('/health', async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    }));
    server.get('/', async () => ({
        name: 'Magic Button API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Chrome Extension + Vertex AI Backend',
        endpoints: {
            health: '/health',
            genai: '/api/genai/*',
            knowledge: '/api/knowledge/*',
        },
    }));
    // Error Handler global
    server.setErrorHandler(async (error, request, reply) => {
        server.log.error(error);
        const statusCode = error.statusCode || 500;
        const message = env_1.config.NODE_ENV === 'development'
            ? error.message
            : 'Internal Server Error';
        reply.code(statusCode).send({
            error: true,
            message,
            ...(env_1.config.NODE_ENV === 'development' && { stack: error.stack }),
        });
    });
    return server;
}
async function startServer() {
    try {
        const server = await createServer();
        const address = await server.listen({
            port: env_1.config.PORT,
            host: '0.0.0.0', // Important pour Cloud Run
        });
        server.log.info(`Server listening at ${address}`);
        server.log.info(`Environment: ${env_1.config.NODE_ENV}`);
        server.log.info(`Project ID: ${env_1.config.PROJECT_ID}`);
        // Graceful shutdown
        const signals = ['SIGTERM', 'SIGINT'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                server.log.info(`Received ${signal}, shutting down gracefully`);
                await server.close();
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.logger.error(error);
        process.exit(1);
    }
}
// Start server si ce fichier est exécuté directement
if (require.main === module) {
    startServer();
}
