const CACHE_NAME = 'kapita-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo1.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // API requests - network first, cache fallback for GET
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
            return response
          })
          .catch(() => {
            return caches.match(request).then((cached) => {
              return cached || new Response(JSON.stringify({ offline: true, message: 'You are offline' }), {
                headers: { 'Content-Type': 'application/json' },
              })
            })
          })
      )
    } else {
      // Non-GET API - try network, queue if offline
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(JSON.stringify({ offline: true, queued: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          })
        })
      )
    }
    return
  }

  // Static assets - cache first
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
  }
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
