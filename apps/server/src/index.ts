import { createApp } from './app.js'
import { db } from './db/index.js'

export const app = createApp()
const PORT = process.env.PORT || 3001
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.SERVERLESS ||
  process.env.NETLIFY
)

async function bootServer() {
  try {
    await db.init()
    const healthy = await db.healthCheck()
    if (!healthy && !isServerless && process.env.NODE_ENV === 'production') {
      console.error('FATAL [Startup]: Relational database health check failed in production mode. Aborting boot.')
      process.exit(1)
    }
  } catch (err: any) {
    if (!isServerless && process.env.NODE_ENV === 'production') {
      console.error('FATAL [Startup]: Relational database migration failed in production mode:', err.message)
      process.exit(1)
    }
    console.warn('[Startup]: DB initialization notice:', err.message)
  }

  if (process.env.NODE_ENV !== 'test' && !isServerless) {
    try {
      app.listen(PORT, () => {
        console.log(`✨ [Ada Server] Live and listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
      })
    } catch (e) {
      console.warn('[Ada Server] app.listen skipped:', e)
    }
  }
}

bootServer()

export default app
