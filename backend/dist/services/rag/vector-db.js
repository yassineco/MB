"use strict";
/**
 * Service de base de données vectorielle avec Firestore
 * Stockage et recherche optimisés pour les embeddings RAG
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorDatabaseService = exports.VectorDatabaseService = void 0;
const logger_1 = require("../../logger");
const vector_db_real_1 = require("./vector-db-real");
/**
 * Service de base de données vectorielle pour RAG
 */
class VectorDatabaseService {
    collectionName;
    realService;
    constructor() {
        this.collectionName = process.env.FIRESTORE_VECTORS_COLLECTION || 'rag_vectors';
        this.realService = new vector_db_real_1.RealVectorDatabaseService();
    }
    /**
     * Stockage d'un chunk avec son embedding
     */
    async storeChunk(chunk, embedding) {
        const vectorDoc = {
            id: chunk.id,
            documentId: chunk.metadata.documentId,
            chunkId: chunk.id,
            content: chunk.content,
            embedding,
            metadata: {
                ...(chunk.metadata.documentTitle && { documentTitle: chunk.metadata.documentTitle }),
                chunkIndex: chunk.metadata.chunkIndex,
                tokenCount: chunk.metadata.tokenCount,
                wordCount: chunk.metadata.wordCount,
                ...(chunk.metadata.language && { language: chunk.metadata.language }),
                ...(chunk.metadata.section && { section: chunk.metadata.section }),
            },
            createdAt: chunk.createdAt,
            updatedAt: new Date(),
        };
        logger_1.logger.info({
            action: 'store_vector_chunk',
            chunkId: chunk.id,
            documentId: chunk.metadata.documentId,
            embeddingDimension: embedding.length,
            contentLength: chunk.content.length,
        }, 'Storing vector chunk');
        try {
            // Stockage réel via service dédié
            await this.realService.storeChunk(chunk, embedding);
            logger_1.logger.info({
                action: 'vector_chunk_stored',
                chunkId: chunk.id,
                documentId: chunk.metadata.documentId,
            }, 'Vector chunk stored successfully');
        }
        catch (error) {
            logger_1.logger.error({
                action: 'store_vector_chunk_error',
                chunkId: chunk.id,
                documentId: chunk.metadata.documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to store vector chunk');
            throw new Error(`Failed to store vector chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Stockage en lot de chunks avec embeddings
     */
    async storeBatch(chunks, embeddings) {
        if (chunks.length !== embeddings.length) {
            throw new Error('Chunks and embeddings arrays must have the same length');
        }
        logger_1.logger.info({
            action: 'store_vector_batch',
            batchSize: chunks.length,
            documentId: chunks[0]?.metadata.documentId,
        }, 'Starting batch vector storage');
        try {
            // Préparer les documents vectoriels
            const vectorDocs = chunks.map((chunk, index) => ({
                id: chunk.id,
                documentId: chunk.metadata.documentId,
                chunkId: chunk.id,
                content: chunk.content,
                embedding: embeddings[index] || [],
                metadata: {
                    ...(chunk.metadata.documentTitle && { documentTitle: chunk.metadata.documentTitle }),
                    chunkIndex: chunk.metadata.chunkIndex,
                    tokenCount: chunk.metadata.tokenCount,
                    wordCount: chunk.metadata.wordCount,
                    ...(chunk.metadata.language && { language: chunk.metadata.language }),
                    ...(chunk.metadata.section && { section: chunk.metadata.section }),
                },
                createdAt: chunk.createdAt,
                updatedAt: new Date(),
            }));
            // Stockage en lot réel via service dédié
            await this.realService.storeBatch(chunks, embeddings);
            logger_1.logger.info({
                action: 'vector_batch_stored',
                batchSize: chunks.length,
                documentId: chunks[0]?.metadata.documentId,
            }, 'Vector batch stored successfully');
        }
        catch (error) {
            logger_1.logger.error({
                action: 'store_vector_batch_error',
                batchSize: chunks.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to store vector batch');
            throw new Error(`Failed to store vector batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Recherche vectorielle par similarité
     */
    async searchSimilar(queryEmbedding, options = {}) {
        const searchOptions = {
            limit: options.limit || 10,
            threshold: options.threshold || 0.7,
            ...(options.userId && { userId: options.userId }),
            ...(options.documentIds && { documentIds: options.documentIds }),
            ...(options.language && { language: options.language }),
            includeMetadata: options.includeMetadata ?? true,
        };
        logger_1.logger.info({
            action: 'vector_search',
            queryDimension: queryEmbedding.length,
            searchOptions,
        }, 'Starting vector similarity search');
        try {
            // Recherche vectorielle réelle via service dédié
            const results = await this.realService.searchSimilar(queryEmbedding, searchOptions);
            logger_1.logger.info({
                action: 'vector_search_completed',
                resultsCount: results.length,
                topSimilarity: results[0]?.similarity,
                queryDimension: queryEmbedding.length,
            }, 'Vector search completed successfully');
            return results;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'vector_search_error',
                queryDimension: queryEmbedding.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to perform vector search');
            throw new Error(`Failed to perform vector search: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Récupération d'un chunk par ID
     */
    async getChunk(chunkId) {
        logger_1.logger.info({
            action: 'get_vector_chunk',
            chunkId,
        }, 'Retrieving vector chunk');
        try {
            // Pour l'instant on cherche dans tous les documents du chunk
            // TODO: Ajouter getChunk au service réel
            const allChunks = await this.realService.getDocumentChunks('');
            const chunk = allChunks.find(c => c.chunkId === chunkId) || null;
            if (chunk) {
                logger_1.logger.info({
                    action: 'vector_chunk_retrieved',
                    chunkId,
                    documentId: chunk.documentId,
                }, 'Vector chunk retrieved successfully');
            }
            else {
                logger_1.logger.info({
                    action: 'vector_chunk_not_found',
                    chunkId,
                }, 'Vector chunk not found');
            }
            return chunk;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_vector_chunk_error',
                chunkId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to retrieve vector chunk');
            throw new Error(`Failed to retrieve vector chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Récupération de tous les chunks d'un document
     */
    async getDocumentChunks(documentId) {
        logger_1.logger.info({
            action: 'get_document_chunks',
            documentId,
        }, 'Retrieving document chunks');
        try {
            const chunks = await this.realService.getDocumentChunks(documentId);
            logger_1.logger.info({
                action: 'document_chunks_retrieved',
                documentId,
                chunksCount: chunks.length,
            }, 'Document chunks retrieved successfully');
            return chunks;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_document_chunks_error',
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to retrieve document chunks');
            throw new Error(`Failed to retrieve document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Suppression de tous les chunks d'un document
     */
    async deleteDocument(documentId) {
        logger_1.logger.info({
            action: 'delete_document_vectors',
            documentId,
        }, 'Deleting document vectors');
        try {
            // Suppression réelle via service dédié
            await this.realService.deleteDocument(documentId);
            logger_1.logger.info({
                action: 'document_vectors_deleted',
                documentId,
            }, 'Document vectors deleted successfully');
        }
        catch (error) {
            logger_1.logger.error({
                action: 'delete_document_vectors_error',
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to delete document vectors');
            throw new Error(`Failed to delete document vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Statistiques de l'index vectoriel
     */
    async getIndexStats() {
        logger_1.logger.info({
            action: 'get_index_stats',
        }, 'Retrieving index statistics');
        try {
            const stats = await this.realService.getIndexStats();
            logger_1.logger.info({
                action: 'index_stats_retrieved',
                stats,
            }, 'Index statistics retrieved successfully');
            return stats;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_index_stats_error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to retrieve index statistics');
            throw new Error(`Failed to retrieve index statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.VectorDatabaseService = VectorDatabaseService;
// Instance singleton
exports.vectorDatabaseService = new VectorDatabaseService();
