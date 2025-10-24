/**
 * Client Vertex AI pour Magic Button
 * Gère les appels à Gemini pour génération de texte
 */
export type AIAction = 'correct' | 'summarize' | 'translate' | 'optimize' | 'analyze';
export interface AIRequest {
    action: AIAction;
    text: string;
    options?: {
        targetLanguage?: string;
        maxLength?: number;
        style?: string;
        context?: string;
    };
}
export interface AIResponse {
    result: string;
    action: AIAction;
    originalLength: number;
    resultLength: number;
    processingTime: number;
}
declare class GeminiClient {
    private vertexAI;
    private model;
    constructor();
    /**
     * Génère une réponse avec Gemini
     */
    private generateContent;
    /**
     * Corrige le texte (orthographe, grammaire, syntaxe)
     */
    correctText(text: string): Promise<string>;
    /**
     * Résume le texte
     */
    summarizeText(text: string, maxLength?: number): Promise<string>;
    /**
     * Traduit le texte
     */
    translateText(text: string, targetLanguage: string): Promise<string>;
    /**
     * Optimise le contenu pour un objectif spécifique
     */
    optimizeContent(text: string, purpose?: string): Promise<string>;
    /**
     * Analyse le texte (sentiment, style, etc.)
     */
    analyzeText(text: string): Promise<string>;
    /**
     * Point d'entrée principal pour traiter les requêtes IA
     */
    processAIRequest(request: AIRequest): Promise<AIResponse>;
    /**
     * Test de connectivité avec Vertex AI
     */
    healthCheck(): Promise<{
        status: string;
        model: string;
        timestamp: string;
    }>;
}
export declare function getGeminiClient(): GeminiClient;
export { GeminiClient };
//# sourceMappingURL=geminiClient.d.ts.map