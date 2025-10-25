import { VertexAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { config } from '../../config/env';
import { logger, createPerformanceLogger } from '../../logger';

/**
 * Client Vertex AI pour Magic Button
 * Gère les appels à Gemini pour génération de texte
 */

// Types pour les actions IA
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

// Configuration des filtres de sécurité Vertex AI
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

class GeminiClient {
  private vertexAI: VertexAI;
  private model: GenerativeModel;

  constructor() {
    this.vertexAI = new VertexAI({
      project: config.PROJECT_ID,
      location: config.VERTEX_LOCATION,
    });

    this.model = this.vertexAI.getGenerativeModel({
      model: config.GENAI_MODEL,
    });

    logger.info('Gemini client initialized', {
      project: config.PROJECT_ID,
      location: config.VERTEX_LOCATION,
      model: config.GENAI_MODEL,
    });
  }

  /**
   * Génère une réponse avec Gemini
   */
  private async generateContent(prompt: string, options: {
    temperature?: number;
    maxOutputTokens?: number;
  } = {}): Promise<string> {
    const perfLogger = createPerformanceLogger('gemini-generate');

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
      if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response structure from Gemini');
      }

      const text = candidate.content.parts[0]?.text;
      if (!text) {
        throw new Error('Empty text response from Gemini');
      }

      perfLogger.end({
        promptLength: prompt.length,
        responseLength: text.length,
        temperature: options.temperature,
      });

      return text.trim();

    } catch (error) {
      perfLogger.error(error as Error, {
        promptLength: prompt.length,
        options,
      });
      throw error;
    }
  }

  /**
   * Corrige le texte (orthographe, grammaire, syntaxe)
   */
  async correctText(text: string): Promise<string> {
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
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
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
  async translateText(text: string, targetLanguage: string): Promise<string> {
    // Normalisation des langues
    const normalizedLanguage = targetLanguage.toLowerCase().includes('en') ? 'English' : targetLanguage;
    
    const prompt = `
You are a professional translator. Translate the following text COMPLETELY into ${normalizedLanguage}.

CRITICAL RULES:
- Translate EVERY single word - leave NO words in the original language
- Use natural, fluent ${normalizedLanguage} expressions
- Maintain professional tone and meaning
- Convert ALL French/other language words to ${normalizedLanguage}
- Provide ONLY the complete translation, no explanations

Text to translate:
"${text}"

Complete ${normalizedLanguage} translation:`;

    return this.generateContent(prompt, {
      temperature: 0.1, // Plus bas pour plus de cohérence
      maxOutputTokens: text.length * 3,
    });
  }

  /**
   * Optimise le contenu pour un objectif spécifique
   */
  async optimizeContent(text: string, purpose: string = 'clarté et impact'): Promise<string> {
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
  async analyzeText(text: string): Promise<string> {
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
  async processAIRequest(request: AIRequest): Promise<AIResponse> {
    const perfLogger = createPerformanceLogger(`ai-${request.action}`);
    const startTime = Date.now();

    try {
      let result: string;

      switch (request.action) {
        case 'correct':
          result = await this.correctText(request.text);
          break;

        case 'summarize':
          result = await this.summarizeText(
            request.text,
            request.options?.maxLength
          );
          break;

        case 'translate':
          // Si pas de langue cible spécifiée, détecter la langue et traduire en anglais
          const targetLang = request.options?.targetLanguage || 'English';
          logger.info(`Translation request - Target language: ${targetLang}`);
          
          result = await this.translateText(
            request.text,
            targetLang
          );
          break;

        case 'optimize':
          result = await this.optimizeContent(
            request.text,
            request.options?.context
          );
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

    } catch (error) {
      perfLogger.error(error as Error);
      throw error;
    }
  }

  /**
   * Test de connectivité avec Vertex AI
   */
  async healthCheck(): Promise<{ status: string; model: string; timestamp: string }> {
    try {
      const testResult = await this.generateContent(
        'Réponds simplement "OK" pour confirmer que tu fonctionnes.',
        { temperature: 0, maxOutputTokens: 10 }
      );

      return {
        status: testResult.includes('OK') ? 'healthy' : 'partial',
        model: config.GENAI_MODEL,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Vertex AI health check failed', { error });
      throw error;
    }
  }
}

// Instance singleton
let geminiClient: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    geminiClient = new GeminiClient();
  }
  return geminiClient;
}

// Export pour tests
export { GeminiClient };