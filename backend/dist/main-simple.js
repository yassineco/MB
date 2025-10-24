"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const env_1 = require("./config/env");
async function start() {
    const server = (0, fastify_1.default)({
        logger: true
    });
    // Route de santé simple
    server.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    // Route principale
    server.get('/', async () => {
        return {
            name: 'Magic Button API',
            version: '1.0.0',
            status: 'running'
        };
    });
    // Route test pour GenAI (réponse simulée pour commencer)
    server.post('/api/genai/process', async (request) => {
        const body = request.body;
        // Réponse simulée rapide
        return {
            result: `Résultat simulé pour action: ${body.action || 'unknown'}`,
            action: body.action || 'unknown',
            processingTime: 150
        };
    });
    try {
        const port = parseInt(String(env_1.config.PORT || '8080'));
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on port ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
