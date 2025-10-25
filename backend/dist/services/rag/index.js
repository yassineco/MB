"use strict";
/**
 * Point d'entrée RAG unifié
 * Exports intelligents (simulation ↔ production)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.realVectorDatabaseService = exports.VertexEmbeddingsService = exports.documentStorageService = exports.chunkingService = exports.vectorDatabaseService = exports.vertexEmbeddingsService = exports.ragService = exports.smartRAGService = void 0;
// ===== SERVICE INTELLIGENT (BASCULE SIMULATION ↔ RÉEL) =====
var smart_rag_1 = require("./smart-rag");
Object.defineProperty(exports, "smartRAGService", { enumerable: true, get: function () { return smart_rag_1.smartRAGService; } });
// ===== SERVICE DE COMPATIBILITÉ =====
var rag_service_bridge_1 = require("./rag-service-bridge");
Object.defineProperty(exports, "ragService", { enumerable: true, get: function () { return rag_service_bridge_1.ragService; } });
// ===== SERVICES RAG (SIMULATION) =====
var embeddings_1 = require("./embeddings");
Object.defineProperty(exports, "vertexEmbeddingsService", { enumerable: true, get: function () { return embeddings_1.vertexEmbeddingsService; } });
var vector_db_1 = require("./vector-db");
Object.defineProperty(exports, "vectorDatabaseService", { enumerable: true, get: function () { return vector_db_1.vectorDatabaseService; } });
var chunking_1 = require("./chunking");
Object.defineProperty(exports, "chunkingService", { enumerable: true, get: function () { return chunking_1.documentChunkingService; } });
var storage_1 = require("./storage");
Object.defineProperty(exports, "documentStorageService", { enumerable: true, get: function () { return storage_1.documentStorageService; } });
// ===== SERVICES RAG (PRODUCTION RÉELLE) =====
var embeddings_real_1 = require("./embeddings-real");
Object.defineProperty(exports, "VertexEmbeddingsService", { enumerable: true, get: function () { return embeddings_real_1.VertexEmbeddingsService; } });
var vector_db_real_1 = require("./vector-db-real");
Object.defineProperty(exports, "realVectorDatabaseService", { enumerable: true, get: function () { return vector_db_real_1.realVectorDatabaseService; } });
