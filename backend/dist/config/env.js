"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
// Schema de validation pour les variables d'environnement
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(8080),
    PROJECT_ID: zod_1.z.string().min(1, 'PROJECT_ID is required'),
    REGION: zod_1.z.string().default('europe-west1'),
    VERTEX_LOCATION: zod_1.z.string().default('us-central1'),
    GENAI_MODEL: zod_1.z.string().default('gemini-1.5-pro'),
    EMBEDDING_MODEL: zod_1.z.string().default('text-embedding-004'),
    BUCKET_NAME: zod_1.z.string().min(1, 'BUCKET_NAME is required'),
    FIRESTORE_DATABASE_ID: zod_1.z.string().default('(default)'),
    HMAC_SECRET: zod_1.z.string().min(32, 'HMAC_SECRET must be at least 32 characters'),
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});
// Validation et parsing des variables d'environnement
function validateEnv() {
    try {
        const env = envSchema.parse(process.env);
        return env;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
            throw new Error(`Environment validation failed:\n${missingVars}`);
        }
        throw error;
    }
}
// Configuration exportée
exports.config = validateEnv();
// Validation au startup
if (exports.config.NODE_ENV === 'production') {
    // Validations supplémentaires pour la production
    if (!exports.config.PROJECT_ID.includes('magic-button')) {
        console.warn('⚠️  PROJECT_ID should contain "magic-button" for this project');
    }
    if (exports.config.HMAC_SECRET.length < 64) {
        console.warn('⚠️  Consider using a longer HMAC_SECRET for production');
    }
}
