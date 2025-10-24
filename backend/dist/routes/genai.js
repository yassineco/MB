"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genaiRoutes = genaiRoutes;
const zod_1 = require("zod");
const geminiClient_1 = require("@/services/vertex/geminiClient");
const logger_1 = require("@/logger");
// Schémas de validation Zod
const aiRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['correct', 'summarize', 'translate', 'optimize', 'analyze']),
    text: zod_1.z.string().min(1, 'Text cannot be empty').max(10000, 'Text too long (max 10000 characters)'),
    options: zod_1.z.object({
        targetLanguage: zod_1.z.string().optional(),
        maxLength: zod_1.z.number().min(50).max(2000).optional(),
        style: zod_1.z.string().optional(),
        context: zod_1.z.string().optional(),
    }).optional(),
});
const healthCheckResponseSchema = zod_1.z.object({
    status: zod_1.z.string(),
    model: zod_1.z.string(),
    timestamp: zod_1.z.string(),
});
/**
 * Routes pour les actions IA (Gemini)
 */
async function genaiRoutes(fastify, options) {
    // Middleware de validation pour toutes les routes
    fastify.addHook('preHandler', async (request, reply) => {
        // Log de la requête (sans le body complet pour éviter les logs trop longs)
        fastify.log.info({
            method: request.method,
            url: request.url,
            userAgent: request.headers['user-agent'],
            contentType: request.headers['content-type'],
            bodySize: JSON.stringify(request.body || {}).length,
        }, 'Incoming GenAI request');
    });
    /**
     * POST /api/genai/action
     * Traite une action IA (corriger, résumer, traduire, etc.)
     */
    fastify.post('/action', {
        schema: {
            body: {
                type: 'object',
                required: ['action', 'text'],
                properties: {
                    action: {
                        type: 'string',
                        enum: ['correct', 'summarize', 'translate', 'optimize', 'analyze'],
                        description: 'Type of AI action to perform',
                    },
                    text: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 10000,
                        description: 'Text to process',
                    },
                    options: {
                        type: 'object',
                        properties: {
                            targetLanguage: {
                                type: 'string',
                                description: 'Target language for translation (e.g., "français", "English")',
                            },
                            maxLength: {
                                type: 'number',
                                minimum: 50,
                                maximum: 2000,
                                description: 'Maximum length for summaries (words)',
                            },
                            style: {
                                type: 'string',
                                description: 'Style preference for optimization',
                            },
                            context: {
                                type: 'string',
                                description: 'Additional context for the action',
                            },
                        },
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                result: { type: 'string' },
                                action: { type: 'string' },
                                originalLength: { type: 'number' },
                                resultLength: { type: 'number' },
                                processingTime: { type: 'number' },
                            },
                        },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean' },
                        message: { type: 'string' },
                        details: { type: 'array' },
                    },
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const perfLogger = (0, logger_1.createPerformanceLogger)('genai-action-endpoint');
        try {
            // Validation du body avec Zod
            const validatedBody = aiRequestSchema.parse(request.body);
            fastify.log.info(`Processing AI request: ${validatedBody.action}, text length: ${validatedBody.text.length}`);
            // Validation spécifique selon l'action
            if (validatedBody.action === 'translate' && !validatedBody.options?.targetLanguage) {
                return reply.code(400).send({
                    error: true,
                    message: 'Target language is required for translation',
                    details: ['options.targetLanguage must be provided for translate action'],
                });
            }
            // Traitement avec Gemini
            const geminiClient = (0, geminiClient_1.getGeminiClient)();
            const aiRequest = {
                action: validatedBody.action,
                text: validatedBody.text,
                options: validatedBody.options,
            };
            const result = await geminiClient.processAIRequest(aiRequest);
            perfLogger.end({
                action: result.action,
                originalLength: result.originalLength,
                resultLength: result.resultLength,
                processingTime: result.processingTime,
            });
            fastify.log.info(`AI request completed: ${result.action} in ${result.processingTime}ms`);
            return reply.code(200).send({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                // Erreur de validation
                const details = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
                perfLogger.error(error, { validationErrors: details });
                return reply.code(400).send({
                    error: true,
                    message: 'Invalid request data',
                    details,
                });
            }
            // Erreur Vertex AI ou autre
            fastify.log.error(`GenAI processing error: ${error instanceof Error ? error.message : error}`);
            perfLogger.error(error);
            return reply.code(500).send({
                error: true,
                message: error instanceof Error ? error.message : 'Internal server error',
            });
        }
    });
    /**
     * GET /api/genai/health
     * Health check pour Vertex AI
     */
    fastify.get('/health', {
        schema: {
            description: 'Health check for Vertex AI integration',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                status: { type: 'string' },
                                model: { type: 'string' },
                                timestamp: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const geminiClient = (0, geminiClient_1.getGeminiClient)();
            const healthStatus = await geminiClient.healthCheck();
            return reply.code(200).send({
                success: true,
                data: healthStatus,
            });
        }
        catch (error) {
            fastify.log.error(`Vertex AI health check failed: ${error instanceof Error ? error.message : error}`);
            return reply.code(500).send({
                success: false,
                error: 'Vertex AI health check failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
    /**
     * GET /api/genai/models
     * Liste des modèles et actions disponibles
     */
    fastify.get('/models', {
        schema: {
            description: 'List available AI models and actions',
            tags: ['Info'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                currentModel: { type: 'string' },
                                actions: {
                                    type: 'array',
                                    items: { type: 'string' },
                                },
                                capabilities: {
                                    type: 'object',
                                    properties: {
                                        maxTextLength: { type: 'number' },
                                        supportedLanguages: {
                                            type: 'array',
                                            items: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return reply.code(200).send({
            success: true,
            data: {
                currentModel: 'gemini-1.5-pro',
                actions: ['correct', 'summarize', 'translate', 'optimize', 'analyze'],
                capabilities: {
                    maxTextLength: 10000,
                    supportedLanguages: [
                        'français',
                        'English',
                        'español',
                        'deutsch',
                        'italiano',
                        'português',
                        '中文',
                        '日本語',
                        'العربية',
                    ],
                },
            },
        });
    });
    fastify.log.info('GenAI routes registered');
}
