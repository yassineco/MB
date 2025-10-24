import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    PROJECT_ID: z.ZodString;
    REGION: z.ZodDefault<z.ZodString>;
    VERTEX_LOCATION: z.ZodDefault<z.ZodString>;
    GENAI_MODEL: z.ZodDefault<z.ZodString>;
    EMBEDDING_MODEL: z.ZodDefault<z.ZodString>;
    BUCKET_NAME: z.ZodString;
    FIRESTORE_DATABASE_ID: z.ZodDefault<z.ZodString>;
    HMAC_SECRET: z.ZodString;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace"]>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    PROJECT_ID: string;
    REGION: string;
    VERTEX_LOCATION: string;
    GENAI_MODEL: string;
    EMBEDDING_MODEL: string;
    BUCKET_NAME: string;
    FIRESTORE_DATABASE_ID: string;
    HMAC_SECRET: string;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
}, {
    PROJECT_ID: string;
    BUCKET_NAME: string;
    HMAC_SECRET: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    REGION?: string | undefined;
    VERTEX_LOCATION?: string | undefined;
    GENAI_MODEL?: string | undefined;
    EMBEDDING_MODEL?: string | undefined;
    FIRESTORE_DATABASE_ID?: string | undefined;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | undefined;
}>;
export declare const config: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    PROJECT_ID: string;
    REGION: string;
    VERTEX_LOCATION: string;
    GENAI_MODEL: string;
    EMBEDDING_MODEL: string;
    BUCKET_NAME: string;
    FIRESTORE_DATABASE_ID: string;
    HMAC_SECRET: string;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
};
export type Config = z.infer<typeof envSchema>;
export {};
//# sourceMappingURL=env.d.ts.map