import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(16).default('development-insecure-jwt-secret-key-at-least-32-chars-length'),
  ALLOWED_ORIGINS: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  FINNHUB_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DATA_FILE_PATH: z.string().optional(),
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
