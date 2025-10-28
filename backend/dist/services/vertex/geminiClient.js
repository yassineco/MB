"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
exports.getGeminiClient = getGeminiClient;
const vertexai_1 = require("@google-cloud/vertexai");
const env_1 = require("../../config/env");
const logger_1 = require("../../logger");
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
        logger_1.logger.info('🤖 Gemini client initialized', {
            project: env_1.config.PROJECT_ID,
            location: env_1.config.VERTEX_LOCATION,
            model: env_1.config.GENAI_MODEL,
            hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
    }
    /**
     * Génère une réponse avec Gemini
     */
    async generateContent(prompt, options = {}) {
        const perfLogger = (0, logger_1.createPerformanceLogger)('gemini-generate');
        logger_1.logger.info('🚀 Calling Vertex AI', {
            promptLength: prompt.length,
            temperature: options.temperature ?? 0.2,
            maxTokens: options.maxOutputTokens ?? 1024,
            model: env_1.config.GENAI_MODEL,
            location: env_1.config.VERTEX_LOCATION
        });
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
                logger_1.logger.error('❌ No response candidates from Gemini', { response });
                throw new Error('No response candidates from Gemini');
            }
            const candidate = response.candidates[0];
            if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                logger_1.logger.error('❌ Invalid response structure from Gemini', { candidate });
                throw new Error('Invalid response structure from Gemini');
            }
            const text = candidate.content.parts[0]?.text;
            if (!text) {
                logger_1.logger.error('❌ Empty text response from Gemini', { candidate });
                throw new Error('Empty text response from Gemini');
            }
            logger_1.logger.info('✅ Vertex AI response received', {
                responseLength: text.length,
                responsePreview: text.substring(0, 100) + '...'
            });
            perfLogger.end({
                promptLength: prompt.length,
                responseLength: text.length,
                temperature: options.temperature,
            });
            return text.trim();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error('❌ Vertex AI call failed', {
                error: errorMessage,
                promptLength: prompt.length,
                options,
            });
            perfLogger.error(error, {
                promptLength: prompt.length,
                options,
            });
            throw error;
        }
    }
    /**
     * Corrige le texte (grammaire, orthographe, style)
     */
    async correctText(text) {
        const prompt = `
CORRECT ALL ERRORS IN THIS TEXT.

RULES:
- FIX spelling mistakes
- FIX grammar errors  
- IMPROVE sentence structure
- KEEP original meaning
- RETURN ONLY THE CORRECTED TEXT

Text to correct: "${text}"

Corrected text:`;
        return this.generateContent(prompt, {
            temperature: 0.1,
            maxOutputTokens: text.length * 2,
        });
    }
    /**
     * Résume le texte
     */
    async summarizeText(text, maxLength = 150) {
        const prompt = `Tu es un assistant qui résume des textes dans leur langue d'origine.

TEXTE À RÉSUMER :
${text}

INSTRUCTIONS :
- Résume ce texte en conservant TOUS les points importants
- Utilise environ ${maxLength} mots
- Écris PLUSIEURS phrases complètes
- Garde la MÊME langue que le texte original (ne traduis pas)
- Sois clair et précis
- Retourne UNIQUEMENT le résumé, sans introduction ni conclusion

RÉSUMÉ :`;
        return this.generateContent(prompt, {
            temperature: 0.4,
            maxOutputTokens: 2048,
        });
    }
    /**
     * Traduit le texte - VERSION SIMPLIFIÉE (1 étape) pour gemini-2.5-flash
     */
    async translateText(text, targetLanguage = 'English') {
        logger_1.logger.info('🌍 Starting translation (SIMPLIFIED - 1 step)', {
            textLength: text.length,
            targetLanguage,
            textPreview: text.substring(0, 100) + '...'
        });
        const translationPrompt = `
You are a professional translator. Translate the following French text into perfect ${targetLanguage}.

CRITICAL REQUIREMENTS:
- Translate EVERY word from French to ${targetLanguage}
- Output ONLY ${targetLanguage} - absolutely NO French words allowed
- Maintain the original meaning and professional tone
- Do NOT add explanations or comments

French text to translate:
"${text}"

Your ${targetLanguage} translation:`;
        logger_1.logger.info('📤 Sending translation request to Gemini');
        const result = await this.generateContent(translationPrompt, {
            temperature: 0.1,
            maxOutputTokens: Math.max(2048, text.length * 4),
        });
        logger_1.logger.info('✅ Translation completed', {
            originalLength: text.length,
            resultLength: result.length,
            resultPreview: result.substring(0, 100) + '...',
            targetLanguage
        });
        return result;
    }
    /**
     * Nettoie la traduction pour éliminer les mots français résiduels
     */
    async cleanUpTranslation(translation, targetLanguage) {
        // Détection élargie des mots et constructions françaises
        const frenchPatterns = [
            // Articles français
            /\bl[ae]s?\b/gi, /\bun[e]?\b/gi, /\bdes?\b/gi, /\bdu\b/gi,
            // Mots de liaison français
            /\bqui\b/gi, /\bque\b/gi, /\bavec\b/gi, /\bdans\b/gi, /\bpour\b/gi, /\bsur\b/gi, /\bpar\b/gi,
            /\bcomme\b/gi, /\bmais\b/gi, /\bet\b/gi, /\bou\b/gi, /\bsi\b/gi,
            // Mots problématiques spécifiques du texte
            /\binstallation\b/gi, /\battractivité\b/gi, /\brévélatrice\b/gi, /\bfavorisent\b/gi,
            /\bpersonnes\b/gi, /\bmême\b/gi, /\bnombre\b/gi, /\bplus\b/gi, /\bgrand\b/gi,
            /\bfait\b/gi, /\bsens\b/gi, /\bforte\b/gi,
            // Apostrophes françaises
            /\bl'/gi, /\bd'/gi, /\bn'/gi, /\bs'/gi, /\bc'/gi, /\bj'/gi, /\bm'/gi, /\bt'/gi,
            // Patterns spécifiques
            /\bd'un\b/gi, /\bd'une\b/gi, /\bd'a\b/gi
        ];
        const hasFrenchContent = frenchPatterns.some(pattern => pattern.test(translation));
        logger_1.logger.info('Translation cleanup check', {
            hasFrenchContent,
            originalText: translation.substring(0, 100) + '...',
            targetLanguage
        });
        if (hasFrenchContent) {
            logger_1.logger.warn('French content detected, applying cleanup', {
                translation: translation.substring(0, 200) + '...'
            });
            const cleanupPrompt = `
EMERGENCY TRANSLATION CLEANUP REQUIRED!

The following text contains French words/phrases mixed with English. 
YOU MUST REWRITE IT COMPLETELY IN PURE ENGLISH.

CRITICAL REQUIREMENTS:
- REMOVE ALL FRENCH WORDS AND PHRASES
- TRANSLATE EVERYTHING TO PERFECT ENGLISH
- NO APOSTROPHES WITH FRENCH WORDS (l', d', n', etc.)
- NO FRENCH ARTICLES (le, la, les, un, une, des, du, de)
- NO FRENCH LINKING WORDS (qui, que, avec, dans, pour, etc.)
- ENSURE 100% ENGLISH OUTPUT

CONTAMINATED TEXT:
"${translation}"

PURE ENGLISH VERSION (NO FRENCH ALLOWED):`;
            const cleanedTranslation = await this.generateContent(cleanupPrompt, {
                temperature: 0.0,
                maxOutputTokens: translation.length * 2,
            });
            logger_1.logger.info('Translation cleaned', {
                before: translation.substring(0, 100) + '...',
                after: cleanedTranslation.substring(0, 100) + '...'
            });
            return cleanedTranslation;
        }
        return translation;
    }
    /**
     * Optimise le contenu pour un objectif spécifique
     */
    async optimizeContent(text, purpose = 'clarté et impact') {
        const prompt = `
TASK: OPTIMIZE TEXT FOR ${purpose.toUpperCase()}

INSTRUCTIONS:
1. IMPROVE clarity, impact, and readability
2. PRESERVE the original meaning and message
3. ENHANCE structure and flow
4. MAKE it more professional and engaging
5. RESPOND ONLY with the optimized text
6. NO explanations, NO comments, NO additional text

PURPOSE: ${purpose}
ORIGINAL TEXT:
"${text}"

OPTIMIZED TEXT:`;
        return this.generateContent(prompt, {
            temperature: 0.2, // Plus cohérent pour optimisation
            maxOutputTokens: text.length * 2,
        });
    }
    /**
     * Analyse le texte (sentiment, style, etc.)
     */
    async analyzeText(text) {
        const prompt = `
TASK: ANALYZE TEXT COMPREHENSIVELY

INSTRUCTIONS:
1. ANALYZE sentiment (positive/negative/neutral) with percentage confidence
2. IDENTIFY writing style and tone
3. LIST strengths and weaknesses
4. PROVIDE specific improvement suggestions
5. BE concise and actionable
6. USE structured format with clear sections

FORMAT YOUR RESPONSE AS:
📊 SENTIMENT: [sentiment] ([confidence]%)
✍️ STYLE: [description]
💪 STRENGTHS: [list]
⚠️ WEAKNESSES: [list]
🎯 SUGGESTIONS: [actionable recommendations]

TEXT TO ANALYZE:
"${text}"

ANALYSIS:`;
        return this.generateContent(prompt, {
            temperature: 0.1, // Très précis pour analyse
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
                    // Mapping des codes de langues vers noms complets
                    const languageMap = {
                        'en': 'English',
                        'es': 'Spanish',
                        'de': 'German',
                        'it': 'Italian',
                        'fr': 'French',
                        'ar': 'Arabic',
                        'pt': 'Portuguese',
                        'ru': 'Russian',
                        'zh': 'Chinese',
                        'ja': 'Japanese'
                    };
                    const targetLang = request.options?.targetLanguage || 'en';
                    const fullLanguageName = languageMap[targetLang] || targetLang;
                    logger_1.logger.info(`Translation request - Code: ${targetLang} -> Language: ${fullLanguageName}`);
                    result = await this.translateText(request.text, fullLanguageName);
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
