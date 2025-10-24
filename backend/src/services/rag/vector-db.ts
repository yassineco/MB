/**
 * Service de base de données vectorielle avec Firestore
 * Stockage et recherche optimisés pour les embeddings RAG
 */

import { logger } from '../../logger';
import { DocumentChunk } from './chunking';

export interface VectorDocument {
  id: string;
  documentId: string;
  chunkId: string;
  content: string;
  embedding: number[];
  metadata: {
    documentTitle?: string;
    chunkIndex: number;
    tokenCount: number;
    wordCount: number;
    language?: string;
    section?: string;
    userId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
  rank: number;
}

export interface SearchOptions {
  limit: number;
  threshold: number;        // Seuil de similarité minimum
  userId?: string;          // Filtrer par utilisateur
  documentIds?: string[];   // Filtrer par documents spécifiques
  language?: string;        // Filtrer par langue
  includeMetadata: boolean; // Inclure métadonnées étendues
}

export interface IndexStats {
  totalDocuments: number;
  totalChunks: number;
  averageEmbeddingDimension: number;
  languages: string[];
  oldestDocument: Date;
  newestDocument: Date;
}

/**
 * Service de base de données vectorielle pour RAG
 */
export class VectorDatabaseService {
  private collectionName: string;

  constructor() {
    this.collectionName = process.env.FIRESTORE_VECTORS_COLLECTION || 'rag_vectors';
  }

  /**
   * Stockage d'un chunk avec son embedding
   */
  async storeChunk(chunk: DocumentChunk, embedding: number[]): Promise<void> {
    const vectorDoc: VectorDocument = {
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

    logger.info({
      action: 'store_vector_chunk',
      chunkId: chunk.id,
      documentId: chunk.metadata.documentId,
      embeddingDimension: embedding.length,
      contentLength: chunk.content.length,
    }, 'Storing vector chunk');

    try {
      // Simulation du stockage Firestore
      await this.simulateFirestoreWrite(vectorDoc);

      logger.info({
        action: 'vector_chunk_stored',
        chunkId: chunk.id,
        documentId: chunk.metadata.documentId,
      }, 'Vector chunk stored successfully');

    } catch (error) {
      logger.error({
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
  async storeBatch(chunks: DocumentChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunks and embeddings arrays must have the same length');
    }

    logger.info({
      action: 'store_vector_batch',
      batchSize: chunks.length,
      documentId: chunks[0]?.metadata.documentId,
    }, 'Starting batch vector storage');

    try {
      // Préparer les documents vectoriels
      const vectorDocs: VectorDocument[] = chunks.map((chunk, index) => ({
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

      // Simulation du stockage en lot Firestore
      await this.simulateFirestoreBatchWrite(vectorDocs);

      logger.info({
        action: 'vector_batch_stored',
        batchSize: chunks.length,
        documentId: chunks[0]?.metadata.documentId,
      }, 'Vector batch stored successfully');

    } catch (error) {
      logger.error({
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
  async searchSimilar(
    queryEmbedding: number[],
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResult[]> {
    const searchOptions: SearchOptions = {
      limit: options.limit || 10,
      threshold: options.threshold || 0.7,
      ...(options.userId && { userId: options.userId }),
      ...(options.documentIds && { documentIds: options.documentIds }),
      ...(options.language && { language: options.language }),
      includeMetadata: options.includeMetadata ?? true,
    };

    logger.info({
      action: 'vector_search',
      queryDimension: queryEmbedding.length,
      searchOptions,
    }, 'Starting vector similarity search');

    try {
      // Simulation de la recherche vectorielle
      const results = await this.simulateVectorSearch(queryEmbedding, searchOptions);

      logger.info({
        action: 'vector_search_completed',
        resultsCount: results.length,
        topSimilarity: results[0]?.similarity,
        queryDimension: queryEmbedding.length,
      }, 'Vector search completed successfully');

      return results;

    } catch (error) {
      logger.error({
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
  async getChunk(chunkId: string): Promise<VectorDocument | null> {
    logger.info({
      action: 'get_vector_chunk',
      chunkId,
    }, 'Retrieving vector chunk');

    try {
      const chunk = await this.simulateFirestoreRead(chunkId);

      if (chunk) {
        logger.info({
          action: 'vector_chunk_retrieved',
          chunkId,
          documentId: chunk.documentId,
        }, 'Vector chunk retrieved successfully');
      } else {
        logger.info({
          action: 'vector_chunk_not_found',
          chunkId,
        }, 'Vector chunk not found');
      }

      return chunk;

    } catch (error) {
      logger.error({
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
  async getDocumentChunks(documentId: string): Promise<VectorDocument[]> {
    logger.info({
      action: 'get_document_chunks',
      documentId,
    }, 'Retrieving document chunks');

    try {
      const chunks = await this.simulateFirestoreQuery(documentId);

      logger.info({
        action: 'document_chunks_retrieved',
        documentId,
        chunksCount: chunks.length,
      }, 'Document chunks retrieved successfully');

      return chunks;

    } catch (error) {
      logger.error({
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
  async deleteDocument(documentId: string): Promise<void> {
    logger.info({
      action: 'delete_document_vectors',
      documentId,
    }, 'Deleting document vectors');

    try {
      // Simulation de la suppression des vecteurs
      const deletedCount = await this.simulateFirestoreDelete(documentId);

      logger.info({
        action: 'document_vectors_deleted',
        documentId,
        deletedCount,
      }, 'Document vectors deleted successfully');

    } catch (error) {
      logger.error({
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
  async getIndexStats(): Promise<IndexStats> {
    logger.info({
      action: 'get_index_stats',
    }, 'Retrieving index statistics');

    try {
      const stats = await this.simulateIndexStats();

      logger.info({
        action: 'index_stats_retrieved',
        stats,
      }, 'Index statistics retrieved successfully');

      return stats;

    } catch (error) {
      logger.error({
        action: 'get_index_stats_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to retrieve index statistics');

      throw new Error(`Failed to retrieve index statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === Méthodes de simulation pour développement ===

  /**
   * Simulation de l'écriture Firestore
   */
  private async simulateFirestoreWrite(vectorDoc: VectorDocument): Promise<void> {
    // Simuler un délai d'écriture
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simuler une validation des données
    if (!vectorDoc.id || !vectorDoc.content || !vectorDoc.embedding.length) {
      throw new Error('Invalid vector document data');
    }

    // L'écriture est simulée comme réussie
  }

  /**
   * Simulation de l'écriture en lot Firestore
   */
  private async simulateFirestoreBatchWrite(vectorDocs: VectorDocument[]): Promise<void> {
    // Simuler un délai d'écriture en lot
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simuler une limite de lot Firestore (500 opérations)
    if (vectorDocs.length > 500) {
      throw new Error('Batch size exceeds Firestore limit of 500 operations');
    }

    // Valider chaque document
    for (const doc of vectorDocs) {
      if (!doc.id || !doc.content || !doc.embedding.length) {
        throw new Error('Invalid vector document in batch');
      }
    }

    // L'écriture en lot est simulée comme réussie
  }

  /**
   * Simulation de la recherche vectorielle
   */
  private async simulateVectorSearch(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // Simuler un délai de recherche
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simuler des documents vectoriels
    const mockDocs = this.generateMockVectorDocuments(20);

    // Calculer les similarités
    const results: SearchResult[] = mockDocs
      .map((doc, index) => ({
        document: doc,
        similarity: this.calculateSimulatedSimilarity(queryEmbedding, doc.embedding),
        rank: index + 1,
      }))
      .filter(result => result.similarity >= options.threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit);

    return results;
  }

  /**
   * Simulation de la lecture Firestore
   */
  private async simulateFirestoreRead(chunkId: string): Promise<VectorDocument | null> {
    // Simuler un délai de lecture
    await new Promise(resolve => setTimeout(resolve, 30));

    // Simuler une recherche par ID
    if (chunkId.includes('nonexistent')) {
      return null;
    }

    // Retourner un document simulé
    return this.generateMockVectorDocument(chunkId);
  }

  /**
   * Simulation de la requête Firestore
   */
  private async simulateFirestoreQuery(documentId: string): Promise<VectorDocument[]> {
    // Simuler un délai de requête
    await new Promise(resolve => setTimeout(resolve, 80));

    // Générer des chunks simulés pour le document
    const chunkCount = Math.floor(Math.random() * 10) + 3; // 3-12 chunks
    const chunks: VectorDocument[] = [];

    for (let i = 0; i < chunkCount; i++) {
      chunks.push(this.generateMockVectorDocument(`${documentId}_chunk_${i}`, documentId));
    }

    return chunks;
  }

  /**
   * Simulation de la suppression Firestore
   */
  private async simulateFirestoreDelete(documentId: string): Promise<number> {
    // Simuler un délai de suppression
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simuler le nombre de documents supprimés
    return Math.floor(Math.random() * 10) + 5; // 5-14 chunks supprimés
  }

  /**
   * Simulation des statistiques d'index
   */
  private async simulateIndexStats(): Promise<IndexStats> {
    // Simuler un délai de calcul des stats
    await new Promise(resolve => setTimeout(resolve, 200));

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalDocuments: 42,
      totalChunks: 287,
      averageEmbeddingDimension: 768,
      languages: ['en', 'fr', 'es'],
      oldestDocument: oneWeekAgo,
      newestDocument: now,
    };
  }

  // === Méthodes utilitaires ===

  /**
   * Génération d'un document vectoriel simulé
   */
  private generateMockVectorDocument(chunkId: string, documentId?: string): VectorDocument {
    const docId = documentId || `doc_${Math.random().toString(36).substring(2, 8)}`;
    const chunkIndex = parseInt(chunkId.split('_').pop() || '0');

    return {
      id: chunkId,
      documentId: docId,
      chunkId,
      content: `This is simulated content for chunk ${chunkId}. ` +
               `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
               `Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      embedding: this.generateSimulatedEmbedding(768),
      metadata: {
        documentTitle: `Document ${docId}`,
        chunkIndex,
        tokenCount: 75 + Math.floor(Math.random() * 50),
        wordCount: 25 + Math.floor(Math.random() * 20),
        language: Math.random() > 0.5 ? 'en' : 'fr',
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };
  }

  /**
   * Génération de plusieurs documents vectoriels simulés
   */
  private generateMockVectorDocuments(count: number): VectorDocument[] {
    const docs: VectorDocument[] = [];
    for (let i = 0; i < count; i++) {
      const chunkId = `mock_chunk_${i}`;
      docs.push(this.generateMockVectorDocument(chunkId));
    }
    return docs;
  }

  /**
   * Génération d'un embedding simulé
   */
  private generateSimulatedEmbedding(dimension: number): number[] {
    const embedding: number[] = [];
    for (let i = 0; i < dimension; i++) {
      // Générer des valeurs entre -1 et 1 avec distribution normale simulée
      embedding.push((Math.random() - 0.5) * 2);
    }
    return embedding;
  }

  /**
   * Calcul de similarité simulé
   */
  private calculateSimulatedSimilarity(embedding1: number[], embedding2: number[]): number {
    // Simuler une similarité cosinus avec variation aléatoire
    const baseSimilarity = 0.3 + Math.random() * 0.6; // Entre 0.3 et 0.9
    
    // Ajouter une légère variation basée sur la "distance" des embeddings
    const variation = (Math.random() - 0.5) * 0.2;
    
    return Math.max(0, Math.min(1, baseSimilarity + variation));
  }
}

// Instance singleton
export const vectorDatabaseService = new VectorDatabaseService();