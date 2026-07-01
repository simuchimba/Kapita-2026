const CACHE_NAME = 'kapita-cache-v2'
const API_CACHE = 'kapita-api-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo1.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k))
      )
    })
  )
  self.clients.claim()
})

function shouldCache(url) {
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return true
  if (url.pathname.startsWith('/assets/')) return true
  if (url.pathname === '/' || url.pathname === '/index.html') return true
  return false
}

function isMutation(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
}

function isAuth(url) {
  return url.pathname.includes('/auth/')
}

function networkFirst(event) {
  return fetch(event.request).then((response) => {
    const clone = response.clone()
    caches.open(API_CACHE).then((cache) => {
      cache.put(event.request, clone)
    })
    return response
  }).catch(() => {
    return caches.match(event.request).then((cached) => {
      if (cached) return cached
      return new Response(JSON.stringify({ offline: true, message: 'No cached data available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    })
  })
}

function cacheFirst(event) {
  return caches.match(event.request).then((cached) => {
    if (cached) return cached
    return fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
      }
      return response
    })
  })
}

function staleWhileRevalidate(event) {
  const cached = caches.match(event.request)
  const fetched = fetch(event.request).then((response) => {
    if (response.ok) {
      const clone = response.clone()
      caches.open(API_CACHE).then((cache) => cache.put(event.request, clone))
    }
    return response
  })
  return cached.then(c => c || fetched)
}

function handleMutationOffline(event) {
  return caches.match(event.request).then((cached) => {
    if (cached) return cached
    return new Response(JSON.stringify({ offline: true, queued: true, message: 'Request queued for sync' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (!shouldCache(url)) return

  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      if (isAuth(url)) {
        event.respondWith(networkFirst(event))
      } else {
        event.respondWith(staleWhileRevalidate(event))
      }
    } else {
      event.respondWith(
        fetch(event.request).catch(() => handleMutationOffline(event))
      )
    }
    return
  }

  event.respondWith(cacheFirst(event))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
    caches.delete(API_CACHE)
    event.source?.postMessage({ type: 'CACHE_CLEARED' })
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(processSyncQueue())
  }
})

async function processSyncQueue() {
  const clients = await self.clients.matchAll()
  for (const client of clients) {
    client.postMessage({ type: 'TRIGGER_SYNC' })
  }
}
