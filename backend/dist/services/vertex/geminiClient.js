"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
exports.getGeminiClient = getGeminiClient;
const vertexai_1 = require("@google-cloud/vertexai");
const env_1 = require("@/config/env");
const logger_1 = require("@/logger");
// Configuration des filtres de sécurité Vertex AI
const SAFETY_SETTINGS = [
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];
class GeminiClient {
    vertexAI;
    model;
    constructor() {
        this.vertexAI = new vertexai_1.VertexAI({
            project: env_1.config.PROJECT_ID,
            location: env_1.config.VERTEX_LOCATION,
        });
        this.model = this.vertexAI.getGenerativeModel({
            model: env_1.config.GENAI_MODEL,
        });
        logger_1.logger.info('Gemini client initialized', {
            project: env_1.config.PROJECT_ID,
            location: env_1.config.VERTEX_LOCATION,
            model: env_1.config.GENAI_MODEL,
        });
    }
    /**
     * Génère une réponse avec Gemini
     */
    async generateContent(prompt, options = {}) {
        const perfLogger = (0, logger_1.createPerformanceLogger)('gemini-generate');
        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options.temperature ?? 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: options.maxOutputTokens ?? 1024,
                    candidateCount: 1,
                },
                safetySettings: SAFETY_SETTINGS,
            });
            const response = result.response;
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No response candidates from Gemini');
            }
            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error('Invalid response structure from Gemini');
            }
            const text = candidate.content.parts[0].text;
            if (!text) {
                throw new Error('Empty text response from Gemini');
            }
            perfLogger.end({
                promptLength: prompt.length,
                responseLength: text.length,
                temperature: options.temperature,
            });
            return text.trim();
        }
        catch (error) {
            perfLogger.error(error, {
                promptLength: prompt.length,
                options,
            });
            throw error;
        }
    }
    /**
     * Corrige le texte (orthographe, grammaire, syntaxe)
     */
    async correctText(text) {
        const prompt = `
Corrige les erreurs d'orthographe, de grammaire et de syntaxe dans le texte suivant.
Préserve le style et le ton original.
Ne modifie que les erreurs évidentes.
Réponds uniquement avec le texte corrigé, sans commentaires.

Texte à corriger :
"${text}"

Texte corrigé :`;
        return this.generateContent(prompt, {
            temperature: 0.1, // Très faible pour cohérence
            maxOutputTokens: Math.max(text.length * 2, 256),
        });
    }
    /**
     * Résume le texte
     */
    async summarizeText(text, maxLength = 200) {
        const prompt = `
Résume le texte suivant en maximum ${maxLength} mots.
Conserve les points clés et les informations essentielles.
Utilise un style clair et concis.
Réponds uniquement avec le résumé, sans commentaires.

Texte à résumer :
"${text}"

Résumé (max ${maxLength} mots) :`;
        return this.generateContent(prompt, {
            temperature: 0.3,
            maxOutputTokens: Math.min(maxLength * 2, 512),
        });
    }
    /**
     * Traduit le texte
     */
    async translateText(text, targetLanguage) {
        const prompt = `
Traduis le texte suivant vers ${targetLanguage}.
Préserve le style, le ton et les nuances.
Adapte les expressions idiomatiques si nécessaire.
Réponds uniquement avec la traduction, sans commentaires.

Texte à traduire :
"${text}"

Traduction en ${targetLanguage} :`;
        return this.generateContent(prompt, {
            temperature: 0.2,
            maxOutputTokens: text.length * 2,
        });
    }
    /**
     * Optimise le contenu pour un objectif spécifique
     */
    async optimizeContent(text, purpose = 'clarté et impact') {
        const prompt = `
Optimise le texte suivant pour ${purpose}.
Améliore la clarté, l'impact et la lisibilité.
Conserve le message principal tout en améliorant la forme.
Réponds uniquement avec le texte optimisé, sans commentaires.

Objectif : ${purpose}
Texte original :
"${text}"

Texte optimisé :`;
        return this.generateContent(prompt, {
            temperature: 0.4, // Plus créatif pour optimisation
            maxOutputTokens: text.length * 2,
        });
    }
    /**
     * Analyse le texte (sentiment, style, etc.)
     */
    async analyzeText(text) {
        const prompt = `
Analyse le texte suivant et fournis :
- Sentiment général (positif/négatif/neutre)
- Style et ton
- Points forts et points d'amélioration
- Suggestions d'optimisation

Texte à analyser :
"${text}"

Analyse :`;
        return this.generateContent(prompt, {
            temperature: 0.3,
            maxOutputTokens: 512,
        });
    }
    /**
     * Point d'entrée principal pour traiter les requêtes IA
     */
    async processAIRequest(request) {
        const perfLogger = (0, logger_1.createPerformanceLogger)(`ai-${request.action}`);
        const startTime = Date.now();
        try {
            let result;
            switch (request.action) {
                case 'correct':
                    result = await this.correctText(request.text);
                    break;
                case 'summarize':
                    result = await this.summarizeText(request.text, request.options?.maxLength);
                    break;
                case 'translate':
                    if (!request.options?.targetLanguage) {
                        throw new Error('Target language is required for translation');
                    }
                    result = await this.translateText(request.text, request.options.targetLanguage);
                    break;
                case 'optimize':
                    result = await this.optimizeContent(request.text, request.options?.context);
                    break;
                case 'analyze':
                    result = await this.analyzeText(request.text);
                    break;
                default:
                    throw new Error(`Unsupported AI action: ${request.action}`);
            }
            const processingTime = Date.now() - startTime;
            perfLogger.end({
                originalLength: request.text.length,
                resultLength: result.length,
                processingTime,
            });
            return {
                result,
                action: request.action,
                originalLength: request.text.length,
                resultLength: result.length,
                processingTime,
            };
        }
        catch (error) {
            perfLogger.error(error);
            throw error;
        }
    }
    /**
     * Test de connectivité avec Vertex AI
     */
    async healthCheck() {
        try {
            const testResult = await this.generateContent('Réponds simplement "OK" pour confirmer que tu fonctionnes.', { temperature: 0, maxOutputTokens: 10 });
            return {
                status: testResult.includes('OK') ? 'healthy' : 'partial',
                model: env_1.config.GENAI_MODEL,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Vertex AI health check failed', { error });
            throw error;
        }
    }
}
exports.GeminiClient = GeminiClient;
// Instance singleton
let geminiClient = null;
function getGeminiClient() {
    if (!geminiClient) {
        geminiClient = new GeminiClient();
    }
    return geminiClient;
}
//# sourceMappingURL=geminiClient.js.map