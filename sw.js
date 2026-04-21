const CACHE = 'predadorfin-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Requisições ao Supabase sempre vão para a rede
  if(e.request.url.includes('supabase.co')){
    e.respondWith(fetch(e.request))
    return
  }
  // Demais recursos: cache-first, fallback para rede
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached
      return fetch(e.request).then(resp => {
        if(!resp || resp.status !== 200 || resp.type !== 'basic') return resp
        const clone = resp.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return resp
      }).catch(() => caches.match('/index.html'))
    })
  )
})
