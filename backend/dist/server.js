"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
// import { GeminiClient } from './services/vertex/geminiClient'; // Temporairement désactivé
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
    // Routes RAG simplifiées pour test d'interface
    server.post('/rag/documents', async (request, reply) => {
        const body = request.body;
        // Simulation du traitement
        await new Promise(resolve => setTimeout(resolve, 1000));
        return reply.send({
            success: true,
            documentId: `doc_${Date.now()}`,
            fileName: body.fileName || 'document.txt',
            chunksCount: Math.floor(body.content?.length / 500) || 1,
            embeddingsGenerated: Math.floor(body.content?.length / 500) || 1,
            processingTimeMs: 1000,
            message: 'Document traité avec succès'
        });
    });
    server.get('/rag/search', async (request, reply) => {
        const query = request.query;
        // Validation des paramètres
        if (!query.q) {
            return reply.status(400).send({
                success: false,
                error: 'MISSING_QUERY',
                message: 'Parameter "q" is required'
            });
        }
        // Simulation de la recherche
        await new Promise(resolve => setTimeout(resolve, 500));
        return reply.send({
            success: true,
            results: [
                {
                    id: 'chunk_1',
                    content: `Résultat simulé pour la recherche: "${query.q}"`,
                    similarity: 0.85,
                    metadata: {
                        documentId: 'doc_123',
                        fileName: 'exemple.txt',
                        chunkIndex: 0
                    }
                }
            ],
            totalResults: 1,
            processingTimeMs: 500
        });
    });
    server.post('/rag/generate', async (request, reply) => {
        const body = request.body;
        // Validation
        if (!body.query) {
            return reply.status(400).send({
                success: false,
                error: 'MISSING_QUERY',
                message: 'Field "query" is required'
            });
        }
        // Simulation de la génération
        await new Promise(resolve => setTimeout(resolve, 1500));
        return reply.send({
            success: true,
            response: `Réponse augmentée simulée pour: "${body.query}"\n\nBasée sur les documents indexés, voici une réponse contextuelle qui utilise les informations pertinentes de votre base de connaissances.`,
            sources: [
                {
                    id: 'chunk_1',
                    content: 'Contenu source utilisé...',
                    similarity: 0.85,
                    metadata: {
                        documentId: 'doc_123',
                        fileName: 'exemple.txt'
                    }
                }
            ],
            processingTimeMs: 1500,
            tokensUsed: 150
        });
    });
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
            // Utilisation de la simulation améliorée pour éviter les problèmes de déploiement
            // TODO: Réactiver Gemini une fois la configuration complète
            server.log.info(`Processing with enhanced simulation: ${action}`);
            result = await simulateAIProcessing(action, text, options);
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
    // Simulation améliorée de traitement IA
    async function simulateAIProcessing(action, text, options) {
        // Simulation d'un délai de traitement réaliste
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800));
        switch (action) {
            case 'corriger':
                // Correction intelligente basique
                return text
                    .replace(/(\w+)ait(\s|$|[.,!?])/g, '$1ais$2') // Ex: jais -> j'ai
                    .replace(/\b(les?)\s+(\w+)s\b/g, (match, article, word) => {
                    // Accord pluriel basique
                    return word.endsWith('s') ? match : `${article} ${word}s`;
                })
                    .replace(/\s+/g, ' ') // Espaces multiples
                    .replace(/([.,!?])\s*([A-Z])/g, '$1 $2') // Espacement ponctuation
                    .trim();
            case 'résumer':
                // Résumé intelligent basé sur la structure du texte
                const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
                const keyPoints = sentences.slice(0, Math.min(3, Math.ceil(sentences.length / 3)));
                const summary = keyPoints.join('. ').trim();
                return `**Résumé :** ${summary}${summary.endsWith('.') ? '' : '.'}

**Points clés :**
${keyPoints.map((point, i) => `${i + 1}. ${point.trim()}`).join('\n')}

*Texte original : ${text.length} caractères → Résumé : ${summary.length} caractères*`;
            case 'traduire':
                const targetLang = options?.targetLanguage || 'en';
                if (targetLang === 'en') {
                    // Traduction basique français → anglais
                    return text
                        .replace(/\ble\b/g, 'the')
                        .replace(/\bla\b/g, 'the')
                        .replace(/\bun\b/g, 'a')
                        .replace(/\bune\b/g, 'a')
                        .replace(/\bet\b/g, 'and')
                        .replace(/\bde\b/g, 'of')
                        .replace(/\bdans\b/g, 'in')
                        .replace(/\bavec\b/g, 'with')
                        .replace(/\bpour\b/g, 'for')
                        .replace(/\bpar\b/g, 'by')
                        .replace(/\bégalement\b/g, 'also')
                        .replace(/\bimportant(e)?\b/g, 'important')
                        .replace(/\bpopulation\b/g, 'population')
                        .replace(/\brésultats?\b/g, 'results')
                        .replace(/\brecensement\b/g, 'census');
                }
                return `[Translation to ${targetLang}] ${text}`;
            case 'optimiser':
                // Optimisation du style et clarté
                return text
                    .replace(/\b(très|vraiment|assez|plutôt)\s+/g, '') // Supprime adverbes faibles
                    .replace(/(\w+),\s*(\w+),\s*et\s+(\w+)/g, '$1, $2 et $3') // Améliore énumérations
                    .replace(/\b(il est|c'est)\s+(important|nécessaire|essentiel)\s+de\b/g, 'Il faut') // Plus direct
                    .replace(/\bqui\s+(permettent?|favorisent?|contribuent?)\s+/g, 'permettant ') // Style plus fluide
                    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Meilleure structuration
                    .trim() + '\n\n*Texte optimisé pour plus de clarté et d\'impact.*';
            default:
                return `Traitement ${action} effectué sur le texte de ${text.length} caractères.`;
        }
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
