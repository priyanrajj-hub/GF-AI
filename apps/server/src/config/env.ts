import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(16).default('development-insecure-jwt-secret-key-at-least-32-chars-length'),
  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  ENABLE_TEST_AUTH: z.string().optional(),
  APP_URL: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  STRICT_ENV_VALIDATION: z.string().optional(),

  // Databases
  DATABASE_URL: z.string().optional(),
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  LIBSQL_URL: z.string().optional(),
  DATA_FILE_PATH: z.string().optional(),

  // LLM Providers
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEYS: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  HF_MODEL: z.string().optional(),
  HF_TTS_MODEL: z.string().optional(),
  OLLAMA_HOST: z.string().optional(),
  OLLAMA_MODEL: z.string().optional(),

  // Voice & Audio
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  ELEVENLABS_MODEL_ID: z.string().optional(),
  MIKU_VOICE_ENABLED: z.string().optional(),
  MIKU_VOICE_API_KEY: z.string().optional(),
  MIKU_VOICE_API_URL: z.string().optional(),
  MIKU_VOICE_MODEL: z.string().optional(),
  MIKU_VOICE_LICENSE_STATUS: z.string().optional(),

  // Email & Notifications
  RESEND_API_KEY: z.string().optional(),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Market & External Data
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  FINNHUB_API_KEY: z.string().optional(),
  TRIPO_API_KEY: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

let parsedEnv: EnvConfig

try {
  parsedEnv = envSchema.parse(process.env)

  // Fail-fast checks in production
  if (parsedEnv.NODE_ENV === 'production') {
    if (parsedEnv.JWT_SECRET.includes('development-insecure')) {
      console.error('❌ [FATAL SECURITY ERROR]: Production boot requires a custom, high-entropy JWT_SECRET (min 32 chars).')
      if (process.env.STRICT_ENV_VALIDATION === 'true') {
        process.exit(1)
      }
    }
  }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ [CONFIG ERROR] Environment configuration validation failed:')
    const issues = error.issues || (error as any).errors || []
    issues.forEach((err: any) => {
      console.error(`  - ${Array.isArray(err.path) ? err.path.join('.') : err.path}: ${err.message}`)
    })
    process.exit(1)
  }
  throw error
}

export const env = parsedEnv
