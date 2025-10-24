import { FastifyRequest } from 'fastify';
/**
 * Service de signature HMAC pour authentifier les requêtes
 *
 * Format de signature:
 * 1. Timestamp (Unix timestamp en millisecondes)
 * 2. Body de la requête (JSON stringifié)
 * 3. Message = `${timestamp}.${body}`
 * 4. Signature = HMAC-SHA256(message, secret)
 */
export interface SignatureHeaders {
    'x-mb-timestamp': string;
    'x-mb-signature': string;
}
/**
 * Génère une signature HMAC pour une requête
 * Utilisé côté client (extension Chrome)
 */
export declare function generateSignature(payload: string, timestamp: number, secret: string): string;
/**
 * Valide la signature HMAC d'une requête
 * Utilisé côté serveur (API backend)
 */
export declare function validateSignature(request: FastifyRequest): Promise<boolean>;
/**
 * Utilitaire pour créer les headers de signature côté client
 * (Documentation pour l'extension Chrome)
 */
export declare function createSignatureHeaders(payload: object, secret: string): SignatureHeaders;
/**
 * Middleware factory pour valider les signatures
 * Permet d'exclure certaines routes
 */
export declare function createSignatureValidator(excludeRoutes?: string[]): (request: FastifyRequest, reply: any) => Promise<void>;
/**
 * Utilitaire pour tester la signature en développement
 */
export declare function testSignature(): {
    testPayload: {
        test: string;
        timestamp: number;
    };
    timestamp: number;
    signature: string;
};
//# sourceMappingURL=sign.d.ts.map