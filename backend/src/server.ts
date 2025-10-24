import 'dotenv/config';
import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { ragRoutes } from './routes/rag';

// Configuration simple pour commencer
const config = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '8080'),
  PROJECT_ID: process.env.PROJECT_ID || 'magic-button-demo',
  API_VERSION: '1.0.0'
};

// Types pour les requêtes GenAI
interface AIRequest {
  action: 'corriger' | 'résumer' | 'traduire' | 'optimiser';
  text: string;
  options?: {
    targetLanguage?: string;
    maxLength?: number;
    style?: string;
  };
}

interface AIResponse {
  result: string;
  action: string;
  processingTime: number;
  timestamp: string;
}

async function createServer(): Promise<FastifyInstance> {
  const server = fastify({
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
  await server.register(helmet, {
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
  await server.register(cors, {
    origin: (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => {
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
  server.get('/health', async (): Promise<{ status: string; timestamp: string; version: string }> => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: config.API_VERSION
    };
  });

  server.get('/', async (): Promise<object> => {
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
  server.post('/rag/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    
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

  server.get('/rag/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    
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

  server.post('/rag/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    
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
    overallHealth: 'healthy' as const,
    timestamp: new Date().toISOString(),
  }));

  server.get('/rag/stats', async () => ({
    success: true,
    stats: {
      totalDocuments: 0,
      totalChunks: 0, 
      totalEmbeddings: 0,
      processingQueue: 0,
      indexHealth: 'healthy' as const,
      lastUpdate: new Date().toISOString(),
    },
  }));

  // Route GenAI principale
  server.post<{ Body: AIRequest }>('/api/genai/process', {
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
  }, async (request: FastifyRequest<{ Body: AIRequest }>, reply: FastifyReply): Promise<AIResponse> => {
    const startTime = Date.now();
    const { action, text, options } = request.body;

    server.log.info(`Processing AI request: ${action}, text length: ${text.length}`);

    try {
      // Pour l'instant, on simule la réponse IA
      // Plus tard on intégrera Vertex AI ici
      const result = await simulateAIProcessing(action, text, options);

      const processingTime = Date.now() - startTime;
      const response: AIResponse = {
        result,
        action,
        processingTime,
        timestamp: new Date().toISOString()
      };

      server.log.info(`AI request completed: ${action} in ${processingTime}ms`);

      return response;

    } catch (error) {
      server.log.error(`AI processing error: ${error instanceof Error ? error.message : error}`);
      reply.code(500);
      throw new Error('Erreur lors du traitement IA');
    }
  });

  // Simulation de traitement IA (à remplacer par Vertex AI)
  async function simulateAIProcessing(action: string, text: string, options?: any): Promise<string> {
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

    return responses[action as keyof typeof responses] || `Traitement ${action} effectué sur le texte.`;
  }

  // Gestion d'erreurs globale
  server.setErrorHandler(async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    server.log.error(error);

    const statusCode = (error as any).statusCode || 500;
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

async function start(): Promise<void> {
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
    const signals = ['SIGINT', 'SIGTERM'] as const;
    signals.forEach((signal) => {
      process.on(signal, async () => {
        server.log.info(`Received ${signal}, shutting down gracefully`);
        await server.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Démarrage du serveur
start();