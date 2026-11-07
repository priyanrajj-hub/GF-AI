import app from '../apps/server/src/index.js'

export default function handler(req: any, res: any) {
  // Ensure req.url starts with /api so Express routes match
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url)
  }
  return app(req, res)
}
