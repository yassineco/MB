"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
// Configuration simple pour commencer
const config = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: parseInt(process.env.PORT || '8080'),
    PROJECT_ID: process.env.PROJECT_ID || 'magic-button-demo',
    API_VERSION: '1.0.0'
};
async function createServer() {
    const server = (0, fastify_1.default)({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: false,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            }
        },
        trustProxy: true
    });
    // Sécurité avec Helmet
    await server.register(helmet_1.default, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'"]
            }
        }
    });
    // CORS pour extensions Chrome
    await server.register(cors_1.default, {
        origin: (origin, callback) => {
            if (!origin ||
                origin.startsWith('chrome-extension://') ||
                origin.includes('localhost') ||
                config.NODE_ENV === 'development') {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed by CORS'), false);
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Timestamp', 'X-Signature']
    });
    // Routes de base
    server.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: config.API_VERSION
        };
    });
    server.get('/', async () => {
        return {
            name: 'Magic Button API',
            version: config.API_VERSION,
            status: 'running',
            environment: config.NODE_ENV,
            project: config.PROJECT_ID,
            endpoints: {
                health: '/health',
                genai: '/api/genai/process',
                rag: 'Available soon!'
            }
        };
    });
    // Simple RAG health endpoint
    server.get('/rag/health', async () => {
        return {
            success: true,
            services: {
                embeddings: true,
                storage: { success: true },
                vectorDb: true,
            },
            overallHealth: 'healthy',
            timestamp: new Date().toISOString(),
        };
    });
    return server;
}
async function startServer() {
    try {
        const server = await createServer();
        const address = await server.listen({
            port: config.PORT,
            host: '0.0.0.0'
        });
        server.log.info(`🚀 Magic Button API started successfully`);
        server.log.info(`📍 Port: ${config.PORT}`);
        server.log.info(`🌍 Environment: ${config.NODE_ENV}`);
        server.log.info(`🎯 Project: ${config.PROJECT_ID}`);
        // Gestion gracieuse de l'arrêt
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                server.log.info(`Received ${signal}, shutting down gracefully...`);
                await server.close();
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Démarrage du serveur
startServer();
