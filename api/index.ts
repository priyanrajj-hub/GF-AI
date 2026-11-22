import fs from 'node:fs'
import path from 'node:path'

// Ensure node_modules/@ada/shared is accessible inside Vercel Serverless environment
try {
  const rootDir = process.cwd()
  const sharedSrc = path.resolve(rootDir, 'packages/shared')
  const possibleTargets = [
    path.resolve(rootDir, 'node_modules/@ada/shared'),
    path.resolve(rootDir, 'apps/server/node_modules/@ada/shared'),
  ]

  if (fs.existsSync(sharedSrc)) {
    for (const targetLink of possibleTargets) {
      try {
        const parentDir = path.dirname(targetLink)
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true })
        }
        try {
          if (fs.lstatSync(targetLink).isSymbolicLink() && !fs.existsSync(targetLink)) {
            fs.unlinkSync(targetLink)
          }
        } catch {}

        if (!fs.existsSync(targetLink)) {
          try {
            fs.symlinkSync(sharedSrc, targetLink, 'junction')
          } catch {
            fs.cpSync(sharedSrc, targetLink, { recursive: true })
          }
        }
      } catch (innerErr) {
        console.warn(`[Serverless Boot] Failed setting up link at ${targetLink}:`, innerErr)
      }
    }
  }
} catch (e) {
  console.warn('[Serverless Boot] Shared package setup warning:', e)
}

let appPromise: Promise<any> | null = null

async function getApp() {
  if (!appPromise) {
    appPromise = import('../apps/server/src/index.js')
      .then((m) => m.default)
      .catch(() => import('../apps/server/dist/index.js').then((m) => m.default))
  }
  return appPromise
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp()
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url)
    }
    return app(req, res)
  } catch (err: any) {
    console.error('[Vercel Serverless Error]:', err)
    return res.status(500).json({
      error: 'Serverless invocation error',
      message: err?.message || String(err),
    })
  }
}
