const CACHE_NAME = 'ada-pwa-v2'
const ASSETS_TO_CACHE = ['/', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key)
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  // Network first strategy to prevent serving stale application code
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Web Push event listener for Ada proactive briefings and reminders
self.addEventListener('push', (event) => {
  let data = { title: 'Ada Companion', body: 'Good morning! Ada is online and ready.' }
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch {
    if (event.data) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})
