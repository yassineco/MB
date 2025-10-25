"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
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
            // Autoriser les extensions Chrome et développement local
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
                rag: {
                    upload: '/rag/documents',
                    search: '/rag/search',
                    generate: '/rag/generate',
                    stats: '/rag/stats',
                    health: '/rag/health'
                }
            }
        };
    });
    // Routes de test et de santé
    server.get('/rag/health', async () => ({
        success: true,
        services: { embeddings: true, storage: { success: true }, vectorDb: true },
        overallHealth: 'healthy',
        timestamp: new Date().toISOString(),
    }));
    server.get('/rag/stats', async () => ({
        success: true,
        stats: {
            totalDocuments: 0,
            totalChunks: 0,
            totalEmbeddings: 0,
            processingQueue: 0,
            indexHealth: 'healthy',
            lastUpdate: new Date().toISOString(),
        },
    }));
    // Route GenAI principale
    server.post('/api/genai/process', {
        schema: {
            body: {
                type: 'object',
                required: ['action', 'text'],
                properties: {
                    action: {
                        type: 'string',
                        enum: ['corriger', 'résumer', 'traduire', 'optimiser']
                    },
                    text: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 10000
                    },
                    options: {
                        type: 'object',
                        properties: {
                            targetLanguage: { type: 'string' },
                            maxLength: { type: 'number' },
                            style: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        const { action, text, options } = request.body;
        server.log.info(`Processing AI request: ${action}, text length: ${text.length}`);
        try {
            let result;
            // Mapping des actions françaises vers anglaises
            const actionMap = {
                'corriger': 'correct',
                'resumer': 'summarize',
                'traduire': 'translate',
                'optimiser': 'optimize',
                'analyser': 'analyze'
            };
            const mappedAction = actionMap[action] || action;
            // MODE PERSISTANT : Utilisation du vrai client Gemini Vertex AI
            server.log.info(`🚀 MODE PERSISTANT - Processing with Vertex AI: ${action} -> ${mappedAction}`);
            // Import dynamique du client Gemini
            const { getGeminiClient } = await Promise.resolve().then(() => __importStar(require('./services/vertex/geminiClient')));
            const geminiClient = getGeminiClient();
            const aiRequest = {
                action: mappedAction,
                text,
                options: options || {}
            };
            const geminiResponse = await geminiClient.processAIRequest(aiRequest);
            result = geminiResponse.result;
            const processingTime = Date.now() - startTime;
            const response = {
                result,
                action,
                processingTime,
                timestamp: new Date().toISOString()
            };
            server.log.info(`✅ VERTEX AI request completed: ${action} in ${processingTime}ms`);
            return response;
        }
        catch (error) {
            server.log.error(`AI processing error: ${error instanceof Error ? error.message : error}`);
            reply.code(500);
            throw new Error('Erreur lors du traitement IA');
        }
    });
    // Gestion d'erreurs globale
    server.setErrorHandler(async (error, request, reply) => {
        server.log.error(error);
        const statusCode = error.statusCode || 500;
        const message = config.NODE_ENV === 'development' ? error.message : 'Internal Server Error';
        reply.code(statusCode).send({
            error: true,
            message,
            statusCode,
            timestamp: new Date().toISOString()
        });
    });
    return server;
}
async function start() {
    try {
        const server = await createServer();
        await server.listen({
            port: config.PORT,
            host: '0.0.0.0'
        });
        server.log.info(`🚀 Magic Button API started successfully`);
        server.log.info(`📍 Port: ${config.PORT}`);
        server.log.info(`🌍 Environment: ${config.NODE_ENV}`);
        server.log.info(`🎯 Project: ${config.PROJECT_ID}`);
        // Graceful shutdown
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                server.log.info(`Received ${signal}, shutting down gracefully`);
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
start();
