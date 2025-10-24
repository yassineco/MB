/**
 * Service principal RAG - Orchestrateur de toutes les fonctionnalités RAG
 * Gère le pipeline complet : upload → chunking → embeddings → stockage → recherche
 */

import { logger } from '../../logger';
import { vertexEmbeddingsService } from './embeddings';
import { documentChunkingService, DocumentChunk, ChunkingOptions } from './chunking';
import { documentStorageService, DocumentMetadata, UploadResult } from './storage';
import { vectorDatabaseService, VectorDocument, SearchResult, SearchOptions } from './vector-db';

export interface RAGDocument extends DocumentMetadata {
  chunks?: DocumentChunk[];
  vectorDocuments?: VectorDocument[];
}

export interface ProcessingResult {
  document: RAGDocument;
  chunksCount: number;
  embeddingsGenerated: number;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

export interface QueryResult {
  query: string;
  results: SearchResult[];
  processingTimeMs: number;
  totalResults: number;
  searchOptions: SearchOptions;
}

export interface RAGStats {
  totalDocuments: number;
  totalChunks: number;
  totalEmbeddings: number;
  processingQueue: number;
  indexHealth: 'healthy' | 'degraded' | 'critical';
  lastUpdate: Date;
}

/**
 * Service principal RAG
 */
export class RAGService {
  
  /**
   * Pipeline complet de traitement d'un document
   */
  async processDocument(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId?: string,
    options?: {
      chunkingOptions?: Partial<ChunkingOptions>;
      metadata?: Partial<DocumentMetadata>;
    }
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const processId = `proc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    logger.info({
      action: 'rag_process_document',
      processId,
      fileName: originalName,
      mimeType,
      size: fileBuffer.length,
      userId,
    }, 'Starting RAG document processing');

    try {
      // 1. Upload du document vers GCS
      logger.info({ processId, step: 1 }, 'Uploading document to storage');
      const uploadResult = await documentStorageService.uploadDocument(
        fileBuffer,
        originalName,
        mimeType,
        userId,
        options?.metadata
      );

      // 2. Extraction du contenu textuel
      logger.info({ processId, step: 2 }, 'Extracting text content');
      const textContent = await this.extractTextContent(fileBuffer, mimeType);

      // 3. Chunking du document
      logger.info({ processId, step: 3 }, 'Chunking document');
      const chunks = await documentChunkingService.chunkDocument(
        uploadResult.documentId,
        textContent,
        uploadResult.metadata.title,
        options?.chunkingOptions
      );

      // 4. Génération des embeddings
      logger.info({ processId, step: 4, chunksCount: chunks.length }, 'Generating embeddings');
      const embeddings: number[][] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i]!.content;
        const embeddingResponse = await vertexEmbeddingsService.generateDocumentEmbeddings(chunkContent);
        embeddings.push(embeddingResponse.values || []);
        
        // Log de progression pour les gros documents
        if (i % 10 === 0) {
          logger.info({ 
            processId, 
            progress: `${i + 1}/${chunks.length}` 
          }, 'Embedding generation progress');
        }
      }

      // 5. Stockage dans la base de données vectorielle
      logger.info({ processId, step: 5 }, 'Storing vectors in database');
      await vectorDatabaseService.storeBatch(chunks, embeddings);

      // 6. Mise à jour des métadonnées du document
      const updatedMetadata: RAGDocument = {
        ...uploadResult.metadata,
        chunksCount: chunks.length,
        embeddingsGenerated: true,
        processingStatus: 'completed',
        chunks,
      };

      const processingTime = Date.now() - startTime;

      logger.info({
        action: 'rag_document_processed',
        processId,
        documentId: uploadResult.documentId,
        chunksCount: chunks.length,
        embeddingsCount: embeddings.length,
        processingTimeMs: processingTime,
      }, 'RAG document processing completed successfully');

      return {
        document: updatedMetadata,
        chunksCount: chunks.length,
        embeddingsGenerated: embeddings.length,
        processingTimeMs: processingTime,
        success: true,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        action: 'rag_process_document_error',
        processId,
        fileName: originalName,
        error: errorMessage,
        processingTimeMs: processingTime,
      }, 'RAG document processing failed');

      return {
        document: {} as RAGDocument,
        chunksCount: 0,
        embeddingsGenerated: 0,
        processingTimeMs: processingTime,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Recherche sémantique dans la base de connaissances
   */
  async searchKnowledge(
    query: string,
    options?: Partial<SearchOptions>
  ): Promise<QueryResult> {
    const startTime = Date.now();
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    logger.info({
      action: 'rag_search_knowledge',
      searchId,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      options,
    }, 'Starting RAG knowledge search');

    try {
      // 1. Génération de l'embedding de la requête
      logger.info({ searchId, step: 1 }, 'Generating query embedding');
      const queryEmbeddingResponse = await vertexEmbeddingsService.generateQueryEmbeddings(query);
      const queryEmbedding = queryEmbeddingResponse.values;

      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('Failed to generate query embedding');
      }

      // 2. Recherche vectorielle
      logger.info({ searchId, step: 2 }, 'Performing vector search');
      const searchResults = await vectorDatabaseService.searchSimilar(queryEmbedding, options);

      const processingTime = Date.now() - startTime;

      logger.info({
        action: 'rag_knowledge_searched',
        searchId,
        resultsCount: searchResults.length,
        topSimilarity: searchResults[0]?.similarity,
        processingTimeMs: processingTime,
      }, 'RAG knowledge search completed successfully');

      return {
        query,
        results: searchResults,
        processingTimeMs: processingTime,
        totalResults: searchResults.length,
        searchOptions: {
          limit: options?.limit || 10,
          threshold: options?.threshold || 0.7,
          ...(options?.userId && { userId: options.userId }),
          ...(options?.documentIds && { documentIds: options.documentIds }),
          ...(options?.language && { language: options.language }),
          includeMetadata: options?.includeMetadata ?? true,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        action: 'rag_search_knowledge_error',
        searchId,
        query: query.substring(0, 100),
        error: errorMessage,
        processingTimeMs: processingTime,
      }, 'RAG knowledge search failed');

      throw new Error(`Knowledge search failed: ${errorMessage}`);
    }
  }

  /**
   * Génération de réponse augmentée par récupération
   */
  async generateAugmentedResponse(
    query: string,
    maxContextChunks: number = 5,
    searchOptions?: Partial<SearchOptions>
  ): Promise<{
    response: string;
    sources: SearchResult[];
    confidence: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    logger.info({
      action: 'rag_generate_response',
      responseId,
      query: query.substring(0, 100),
      maxContextChunks,
    }, 'Starting augmented response generation');

    try {
      // 1. Recherche des chunks pertinents
      const searchResult = await this.searchKnowledge(query, {
        ...searchOptions,
        limit: maxContextChunks,
      });

      if (searchResult.results.length === 0) {
        logger.info({ responseId }, 'No relevant context found, generating direct response');
        
        return {
          response: "Je n'ai pas trouvé d'informations pertinentes dans la base de connaissances pour répondre à votre question. Pouvez-vous reformuler votre demande ou fournir plus de contexte ?",
          sources: [],
          confidence: 0.1,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // 2. Construction du contexte
      const contextChunks = searchResult.results.slice(0, maxContextChunks);
      const context = contextChunks
        .map(result => result.document.content)
        .join('\n\n---\n\n');

      // 3. Génération de la réponse (simulation d'un appel à un LLM)
      const response = await this.generateContextualResponse(query, context, contextChunks);

      // 4. Calcul de la confiance basé sur les similarités
      const avgSimilarity = contextChunks.reduce((sum, result) => sum + result.similarity, 0) / contextChunks.length;
      const confidence = Math.min(0.95, avgSimilarity * 1.2); // Boost modéré avec plafond

      const processingTime = Date.now() - startTime;

      logger.info({
        action: 'rag_response_generated',
        responseId,
        sourcesUsed: contextChunks.length,
        avgSimilarity,
        confidence,
        processingTimeMs: processingTime,
      }, 'Augmented response generated successfully');

      return {
        response,
        sources: contextChunks,
        confidence,
        processingTimeMs: processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        action: 'rag_generate_response_error',
        responseId,
        error: errorMessage,
        processingTimeMs: processingTime,
      }, 'Augmented response generation failed');

      throw new Error(`Response generation failed: ${errorMessage}`);
    }
  }

  /**
   * Suppression complète d'un document du système RAG
   */
  async deleteDocument(documentId: string): Promise<void> {
    logger.info({
      action: 'rag_delete_document',
      documentId,
    }, 'Starting complete document deletion');

    try {
      // 1. Suppression des vecteurs de la base de données
      await vectorDatabaseService.deleteDocument(documentId);

      // 2. Suppression du document de GCS
      await documentStorageService.deleteDocument(documentId);

      logger.info({
        action: 'rag_document_deleted',
        documentId,
      }, 'Document completely deleted from RAG system');

    } catch (error) {
      logger.error({
        action: 'rag_delete_document_error',
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to delete document from RAG system');

      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Statistiques du système RAG
   */
  async getSystemStats(): Promise<RAGStats> {
    logger.info({
      action: 'rag_get_stats',
    }, 'Retrieving RAG system statistics');

    try {
      // Récupération des statistiques des différents composants
      const [indexStats, storageTest, embeddingsTest] = await Promise.all([
        vectorDatabaseService.getIndexStats(),
        documentStorageService.testConnection(),
        vertexEmbeddingsService.testConnection(),
      ]);

      // Calcul de la santé du système
      let indexHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
      
      if (!storageTest.success || !embeddingsTest) {
        indexHealth = 'critical';
      } else if (indexStats.totalChunks > 10000) {
        indexHealth = 'degraded'; // Performance potentiellement impactée
      }

      const stats: RAGStats = {
        totalDocuments: indexStats.totalDocuments,
        totalChunks: indexStats.totalChunks,
        totalEmbeddings: indexStats.totalChunks, // 1:1 avec les chunks
        processingQueue: 0, // Simulation - pas de queue persistante
        indexHealth,
        lastUpdate: new Date(),
      };

      logger.info({
        action: 'rag_stats_retrieved',
        stats,
      }, 'RAG system statistics retrieved successfully');

      return stats;

    } catch (error) {
      logger.error({
        action: 'rag_get_stats_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to retrieve RAG system statistics');

      throw new Error(`Failed to retrieve system statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === Méthodes utilitaires privées ===

  /**
   * Extraction du contenu textuel selon le type MIME
   */
  private async extractTextContent(fileBuffer: Buffer, mimeType: string): Promise<string> {
    logger.info({
      action: 'extract_text_content',
      mimeType,
      size: fileBuffer.length,
    }, 'Extracting text content from file');

    // Simulation de l'extraction selon le type de fichier
    switch (mimeType) {
      case 'text/plain':
      case 'text/markdown':
        return fileBuffer.toString('utf-8');
      
      case 'application/pdf':
        return this.simulatePDFExtraction(fileBuffer);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.simulateWordExtraction(fileBuffer);
      
      case 'text/html':
        return this.simulateHTMLExtraction(fileBuffer);
      
      case 'application/json':
        return this.simulateJSONExtraction(fileBuffer);
      
      default:
        // Tentative d'extraction en tant que texte
        return fileBuffer.toString('utf-8');
    }
  }

  /**
   * Simulation d'extraction PDF
   */
  private simulatePDFExtraction(fileBuffer: Buffer): string {
    return `[Extracted PDF Content - ${fileBuffer.length} bytes]\n\n` +
           'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
           'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
           'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. ' +
           '\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. ' +
           'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.';
  }

  /**
   * Simulation d'extraction Word
   */
  private simulateWordExtraction(fileBuffer: Buffer): string {
    return `[Extracted Word Document - ${fileBuffer.length} bytes]\n\n` +
           'Document title: Important Business Report\n\n' +
           'Executive Summary:\n' +
           'This document contains important information about our business processes. ' +
           'The following sections detail our methodologies and findings.\n\n' +
           'Section 1: Analysis\n' +
           'Our analysis shows significant improvements in efficiency metrics.';
  }

  /**
   * Simulation d'extraction HTML
   */
  private simulateHTMLExtraction(fileBuffer: Buffer): string {
    const htmlContent = fileBuffer.toString('utf-8');
    // Simulation de suppression des balises HTML
    return htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Simulation d'extraction JSON
   */
  private simulateJSONExtraction(fileBuffer: Buffer): string {
    try {
      const jsonData = JSON.parse(fileBuffer.toString('utf-8'));
      return this.flattenJSONToText(jsonData);
    } catch {
      return fileBuffer.toString('utf-8');
    }
  }

  /**
   * Conversion JSON en texte lisible
   */
  private flattenJSONToText(obj: unknown, prefix = ''): string {
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return `${prefix}: ${obj}\n`;
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => this.flattenJSONToText(item, `${prefix}[${index}]`)).join('');
    }
    
    if (obj && typeof obj === 'object') {
      return Object.entries(obj)
        .map(([key, value]) => this.flattenJSONToText(value, prefix ? `${prefix}.${key}` : key))
        .join('');
    }
    
    return '';
  }

  /**
   * Génération de réponse contextuelle (simulation d'un LLM)
   */
  private async generateContextualResponse(
    query: string,
    context: string,
    sources: SearchResult[]
  ): Promise<string> {
    // Simuler un délai de génération LLM
    await new Promise(resolve => setTimeout(resolve, 500));

    // Analyser la requête pour déterminer le type de réponse
    const isQuestion = query.includes('?') || query.toLowerCase().startsWith('que') || 
                      query.toLowerCase().startsWith('comment') || query.toLowerCase().startsWith('what') ||
                      query.toLowerCase().startsWith('how');

    const queryLower = query.toLowerCase();
    const contextLower = context.toLowerCase();

    // Génération de réponse basée sur le contexte
    let response = '';

    if (isQuestion) {
      response = `Basé sur les documents disponibles, voici la réponse à votre question :\n\n`;
      
      // Extraire des phrases pertinentes du contexte
      const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const relevantSentences = sentences
        .filter(sentence => {
          const sentenceLower = sentence.toLowerCase();
          return queryLower.split(' ')
            .filter(word => word.length > 3)
            .some(word => sentenceLower.includes(word));
        })
        .slice(0, 3);

      if (relevantSentences.length > 0) {
        response += relevantSentences.join('. ') + '.';
      } else {
        response += 'Les informations disponibles suggèrent des éléments pertinents mais nécessitent une analyse plus approfondie pour répondre précisément à votre question.';
      }
    } else {
      response = `Voici les informations pertinentes concernant "${query}" :\n\n`;
      
      // Résumer le contexte
      const contextSummary = context.substring(0, 300) + (context.length > 300 ? '...' : '');
      response += contextSummary;
    }

    // Ajouter les sources
    if (sources.length > 0) {
      response += `\n\n**Sources consultées :**\n`;
      sources.forEach((source, index) => {
        const docTitle = source.document.metadata.documentTitle || `Document ${source.document.documentId}`;
        const similarity = Math.round(source.similarity * 100);
        response += `${index + 1}. ${docTitle} (pertinence: ${similarity}%)\n`;
      });
    }

    return response;
  }
}

// Instance singleton
export const ragService = new RAGService();