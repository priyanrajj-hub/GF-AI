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
