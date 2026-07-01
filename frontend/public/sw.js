const CACHE_NAME = 'kapita-v3'
const API_CACHE = 'kapita-api-v3'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html', '/logo1.png']).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Keep old caches as fallbacks — don't delete them.
  // caches.match() searches ALL caches, so old assets are still found.
  event.waitUntil(self.clients.claim())
})

function mimeFor(url) {
  if (url.pathname.endsWith('.js')) return 'application/javascript'
  if (url.pathname.endsWith('.css')) return 'text/css'
  if (url.pathname.endsWith('.png')) return 'image/png'
  if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg')) return 'image/jpeg'
  if (url.pathname.endsWith('.svg')) return 'image/svg+xml'
  if (url.pathname.endsWith('.ico')) return 'image/x-icon'
  if (url.pathname.endsWith('.woff2')) return 'font/woff2'
  if (url.pathname.endsWith('.json')) return 'application/json'
  return 'text/html'
}

function emptyOk(url) {
  return new Response('', { status: 200, headers: { 'Content-Type': mimeFor(url) } })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Auth endpoints — never cache, never queue
  if (url.pathname.startsWith('/api/') && url.pathname.includes('/auth/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ offline: true }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Non-auth API requests
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      event.respondWith(
        caches.match(request).then((cached) => {
          const fetched = fetch(request)
            .then((res) => {
              if (res.ok) {
                const clone = res.clone()
                caches.open(API_CACHE).then((c) => c.put(request, clone))
              }
              return res
            })
            .catch(() => cached || emptyOk(url))
          return cached || fetched
        })
      )
    } else {
      event.respondWith(
        fetch(request).catch(() =>
          new Response(JSON.stringify({ offline: true, queued: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      )
    }
    return
  }

  // Static assets — cache first across ALL caches, network fallback, empty fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(() => emptyOk(url))
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
    event.source?.postMessage({ type: 'CACHE_CLEARED' })
  }
})
