/**
 * Vercel Serverless Entry Point
 * ─────────────────────────────
 * Re-exports the Express app so Vercel can run it as a serverless function.
 * The Express server's app.listen() call is a no-op in this context —
 * Vercel handles the HTTP layer and simply calls the express handler.
 */
import app from '../apps/server/src/index.js'

export default app
