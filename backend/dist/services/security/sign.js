"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSignature = generateSignature;
exports.validateSignature = validateSignature;
exports.createSignatureHeaders = createSignatureHeaders;
exports.createSignatureValidator = createSignatureValidator;
exports.testSignature = testSignature;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@/config/env");
/**
 * Génère une signature HMAC pour une requête
 * Utilisé côté client (extension Chrome)
 */
function generateSignature(payload, timestamp, secret) {
    const message = `${timestamp}.${payload}`;
    const hmac = crypto_1.default.createHmac('sha256', secret);
    hmac.update(message, 'utf8');
    return hmac.digest('hex');
}
/**
 * Valide la signature HMAC d'une requête
 * Utilisé côté serveur (API backend)
 */
async function validateSignature(request) {
    try {
        const timestamp = request.headers['x-mb-timestamp'];
        const signature = request.headers['x-mb-signature'];
        // Vérifier présence des headers
        if (!timestamp || !signature) {
            request.log.warn('Missing signature headers');
            return false;
        }
        // Vérifier format timestamp
        const requestTime = parseInt(timestamp, 10);
        if (isNaN(requestTime)) {
            request.log.warn('Invalid timestamp format');
            return false;
        }
        // Vérifier que la requête n'est pas trop ancienne (5 minutes max)
        const currentTime = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes en millisecondes
        if (Math.abs(currentTime - requestTime) > maxAge) {
            request.log.warn(`Request timestamp too old: ${Math.abs(currentTime - requestTime)}ms ago`);
            return false;
        }
        // Construire le message à partir du body de la requête
        const body = JSON.stringify(request.body || {});
        const message = `${timestamp}.${body}`;
        // Calculer la signature attendue
        const expectedSignature = crypto_1.default
            .createHmac('sha256', env_1.config.HMAC_SECRET)
            .update(message, 'utf8')
            .digest('hex');
        // Comparaison sécurisée des signatures (protection timing attacks)
        const isValid = crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        if (!isValid) {
            request.log.warn(`Invalid signature: expected ${expectedSignature.length} chars, got ${signature.length} chars`);
        }
        return isValid;
    }
    catch (error) {
        request.log.error(`Signature validation error: ${error instanceof Error ? error.message : error}`);
        return false;
    }
}
/**
 * Utilitaire pour créer les headers de signature côté client
 * (Documentation pour l'extension Chrome)
 */
function createSignatureHeaders(payload, secret) {
    const timestamp = Date.now();
    const body = JSON.stringify(payload);
    const signature = generateSignature(body, timestamp, secret);
    return {
        'x-mb-timestamp': timestamp.toString(),
        'x-mb-signature': signature,
    };
}
/**
 * Middleware factory pour valider les signatures
 * Permet d'exclure certaines routes
 */
function createSignatureValidator(excludeRoutes = []) {
    return async (request, reply) => {
        // Skip validation pour routes exclues
        if (excludeRoutes.includes(request.url)) {
            return;
        }
        const isValid = await validateSignature(request);
        if (!isValid) {
            reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid or missing signature',
                code: 'INVALID_SIGNATURE',
            });
            return;
        }
    };
}
/**
 * Utilitaire pour tester la signature en développement
 */
function testSignature() {
    const testPayload = { test: 'data', timestamp: Date.now() };
    const testSecret = 'test-secret-key-for-development-only';
    const timestamp = Date.now();
    const signature = generateSignature(JSON.stringify(testPayload), timestamp, testSecret);
    console.log('Test Signature:', {
        payload: testPayload,
        timestamp,
        signature,
        headers: createSignatureHeaders(testPayload, testSecret),
    });
    return { testPayload, timestamp, signature };
}
// Validation au démarrage
if (env_1.config.NODE_ENV === 'development') {
    if (env_1.config.HMAC_SECRET === 'your-ultra-secret-hmac-key-here') {
        console.warn('⚠️  Using default HMAC_SECRET in development. Please set a real secret.');
    }
}
