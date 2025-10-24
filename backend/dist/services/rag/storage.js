"use strict";
/**
 * Service de stockage des documents dans Google Cloud Storage
 * Gère l'upload, la récupération et la gestion des documents RAG
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentStorageService = exports.DocumentStorageService = void 0;
const logger_1 = require("../../logger");
/**
 * Service de stockage GCS pour documents RAG
 */
class DocumentStorageService {
    bucketName;
    baseUrl;
    constructor() {
        // Configuration par défaut pour développement
        this.bucketName = process.env.GCS_BUCKET_NAME || 'magic-button-documents';
        this.baseUrl = `https://storage.googleapis.com/${this.bucketName}`;
    }
    /**
     * Upload d'un document vers GCS
     */
    async uploadDocument(fileBuffer, originalName, mimeType, userId, metadata) {
        const documentId = this.generateDocumentId();
        const fileName = this.generateFileName(documentId, originalName);
        logger_1.logger.info({
            action: 'upload_document',
            documentId,
            fileName,
            originalName,
            mimeType,
            size: fileBuffer.length,
            userId,
        }, 'Starting document upload');
        try {
            // Simulation de l'upload GCS pour développement
            const uploadResult = await this.simulateGCSUpload(fileBuffer, fileName, mimeType);
            const docMetadata = {
                id: documentId,
                fileName,
                originalName,
                mimeType,
                size: fileBuffer.length,
                uploadedAt: new Date(),
                ...(userId && { userId }),
                title: metadata?.title || this.extractTitleFromFileName(originalName),
                ...(metadata?.description && { description: metadata.description }),
                tags: metadata?.tags || [],
                ...(metadata?.language && { language: metadata.language }),
                processingStatus: 'pending',
                chunksCount: 0,
                embeddingsGenerated: false,
            };
            const result = {
                documentId,
                fileName,
                publicUrl: uploadResult.publicUrl,
                metadata: docMetadata,
            };
            logger_1.logger.info({
                action: 'document_uploaded',
                documentId,
                fileName,
                publicUrl: result.publicUrl,
                size: fileBuffer.length,
            }, 'Document uploaded successfully');
            return result;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'upload_document_error',
                documentId,
                fileName,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to upload document');
            throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Récupération d'un document depuis GCS
     */
    async getDocument(documentId) {
        logger_1.logger.info({
            action: 'get_document',
            documentId,
        }, 'Retrieving document from storage');
        try {
            // Simulation de la récupération GCS
            const buffer = await this.simulateGCSDownload(documentId);
            logger_1.logger.info({
                action: 'document_retrieved',
                documentId,
                size: buffer.length,
            }, 'Document retrieved successfully');
            return buffer;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'get_document_error',
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to retrieve document');
            throw new Error(`Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Suppression d'un document de GCS
     */
    async deleteDocument(documentId) {
        logger_1.logger.info({
            action: 'delete_document',
            documentId,
        }, 'Deleting document from storage');
        try {
            // Simulation de la suppression GCS
            await this.simulateGCSDelete(documentId);
            logger_1.logger.info({
                action: 'document_deleted',
                documentId,
            }, 'Document deleted successfully');
        }
        catch (error) {
            logger_1.logger.error({
                action: 'delete_document_error',
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to delete document');
            throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Génération d'URL signée pour accès temporaire
     */
    async generateSignedUrl(documentId, expirationMinutes = 60) {
        logger_1.logger.info({
            action: 'generate_signed_url',
            documentId,
            expirationMinutes,
        }, 'Generating signed URL');
        try {
            // Simulation de génération d'URL signée
            const signedUrl = await this.simulateSignedUrlGeneration(documentId, expirationMinutes);
            logger_1.logger.info({
                action: 'signed_url_generated',
                documentId,
                expirationMinutes,
            }, 'Signed URL generated successfully');
            return signedUrl;
        }
        catch (error) {
            logger_1.logger.error({
                action: 'generate_signed_url_error',
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Failed to generate signed URL');
            throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test de connexion au bucket GCS
     */
    async testConnection() {
        logger_1.logger.info({
            action: 'test_gcs_connection',
            bucketName: this.bucketName,
        }, 'Testing GCS connection');
        try {
            // Simulation du test de connexion
            const connectionTest = await this.simulateConnectionTest();
            logger_1.logger.info({
                action: 'gcs_connection_tested',
                success: connectionTest.success,
                bucketExists: connectionTest.bucketExists,
                message: connectionTest.message,
            }, 'GCS connection test completed');
            return connectionTest;
        }
        catch (error) {
            const message = `GCS connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger_1.logger.error({
                action: 'gcs_connection_error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }, message);
            return {
                success: false,
                bucketExists: false,
                message,
            };
        }
    }
    // === Méthodes de simulation pour développement ===
    /**
     * Simulation de l'upload GCS
     */
    async simulateGCSUpload(fileBuffer, fileName, mimeType) {
        // Simuler un délai d'upload
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simuler une validation du fichier
        if (fileBuffer.length === 0) {
            throw new Error('Empty file buffer');
        }
        if (!this.isValidMimeType(mimeType)) {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }
        // Générer une URL publique simulée
        const publicUrl = `${this.baseUrl}/${fileName}`;
        return { publicUrl };
    }
    /**
     * Simulation de la récupération GCS
     */
    async simulateGCSDownload(documentId) {
        // Simuler un délai de téléchargement
        await new Promise(resolve => setTimeout(resolve, 50));
        // Simuler le contenu du document
        const content = `Simulated document content for ${documentId}\n` +
            `This is a test document created at ${new Date().toISOString()}\n` +
            `Document ID: ${documentId}\n` +
            `Lorem ipsum dolor sit amet, consectetur adipiscing elit...`;
        return Buffer.from(content, 'utf-8');
    }
    /**
     * Simulation de la suppression GCS
     */
    async simulateGCSDelete(documentId) {
        // Simuler un délai de suppression
        await new Promise(resolve => setTimeout(resolve, 30));
        // Simuler une vérification d'existence
        if (!documentId || documentId.length < 5) {
            throw new Error('Invalid document ID');
        }
        // La suppression est simulée comme réussie
    }
    /**
     * Simulation de génération d'URL signée
     */
    async simulateSignedUrlGeneration(documentId, expirationMinutes) {
        // Simuler un délai de génération
        await new Promise(resolve => setTimeout(resolve, 20));
        const fileName = `doc_${documentId}.pdf`; // Nom de fichier simulé
        const timestamp = Date.now() + (expirationMinutes * 60 * 1000);
        const signature = this.generateSimulatedSignature(documentId, timestamp);
        return `${this.baseUrl}/${fileName}?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=magic-button%40magic-button-demo.iam.gserviceaccount.com%2F${new Date().toISOString().split('T')[0]}%2Feurope-west1%2Fstorage%2Fgoog4_request&X-Goog-Date=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z&X-Goog-Expires=${expirationMinutes * 60}&X-Goog-SignedHeaders=host&X-Goog-Signature=${signature}`;
    }
    /**
     * Simulation du test de connexion
     */
    async simulateConnectionTest() {
        // Simuler un délai de test
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simuler un test de connexion réussi
        return {
            success: true,
            bucketExists: true,
            message: `Successfully connected to GCS bucket: ${this.bucketName} (simulated)`,
        };
    }
    // === Méthodes utilitaires ===
    /**
     * Génération d'un ID de document unique
     */
    generateDocumentId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `doc_${timestamp}_${random}`;
    }
    /**
     * Génération d'un nom de fichier sécurisé
     */
    generateFileName(documentId, originalName) {
        const extension = this.getFileExtension(originalName);
        const sanitizedName = originalName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
        return `${documentId}_${sanitizedName}${extension}`;
    }
    /**
     * Extraction de l'extension de fichier
     */
    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot) : '';
    }
    /**
     * Extraction du titre depuis le nom de fichier
     */
    extractTitleFromFileName(fileName) {
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        return nameWithoutExt
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }
    /**
     * Validation du type MIME
     */
    isValidMimeType(mimeType) {
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/html',
            'application/json',
        ];
        return allowedTypes.includes(mimeType);
    }
    /**
     * Génération d'une signature simulée
     */
    generateSimulatedSignature(documentId, timestamp) {
        const data = `${documentId}_${timestamp}`;
        // Simulation d'une signature hexadécimale
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }
}
exports.DocumentStorageService = DocumentStorageService;
// Instance singleton
exports.documentStorageService = new DocumentStorageService();
