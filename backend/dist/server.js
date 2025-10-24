"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
                genai: '/api/genai/process'
            }
        };
    });
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
            // Pour l'instant, on simule la réponse IA
            // Plus tard on intégrera Vertex AI ici
            const result = await simulateAIProcessing(action, text, options);
            const processingTime = Date.now() - startTime;
            const response = {
                result,
                action,
                processingTime,
                timestamp: new Date().toISOString()
            };
            server.log.info(`AI request completed: ${action} in ${processingTime}ms`);
            return response;
        }
        catch (error) {
            server.log.error(`AI processing error: ${error instanceof Error ? error.message : error}`);
            reply.code(500);
            throw new Error('Erreur lors du traitement IA');
        }
    });
    // Simulation de traitement IA (à remplacer par Vertex AI)
    async function simulateAIProcessing(action, text, options) {
        // Simulation d'un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        const responses = {
            'corriger': `Texte corrigé : "${text.replace(/jais/g, "j'ai").replace(/erreur/g, "erreurs")}"`,
            'résumer': `Résumé : Ce texte de ${text.length} caractères traite principalement de...`,
            'traduire': options?.targetLanguage === 'en'
                ? `Translation: ${text}`
                : `English translation of the provided text.`,
            'optimiser': `Version optimisée : ${text} (reformulé pour plus de clarté et impact)`
        };
        return responses[action] || `Traitement ${action} effectué sur le texte.`;
    }
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
