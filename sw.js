/* Service worker · Boliche y el misterio de la sombra gigante
   Al actualizar el juego, sube el número de VERSION para que los móviles reciban los cambios. */
const VERSION = 'sombra-v4';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'logo-tigalma.png',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/environments/RoomEnvironment.js'];
const VOICES = ["boliche-hola.mp3", "boliche-que-sera.mp3", "boliche-sombra.mp3", "boliche-corro.mp3", "boliche-tropiezo.mp3", "boliche-respiro.mp3", "boliche-linterna.mp3", "boliche-pluma.mp3", "boliche-huellas.mp3", "boliche-bellota.mp3", "boliche-pequenito.mp3", "boliche-quien.mp3", "boliche-juntos.mp3", "boliche-tambien.mp3", "boliche-acompanar.mp3", "boliche-senal.mp3", "boliche-miedo-pequeno.mp3", "boliche-adios.mp3", "oruga-hola.mp3", "oruga-pregunta-miedo.mp3", "oruga-correr.mp3", "oruga-manten.mp3", "oruga-respirar-bien.mp3", "oruga-linterna.mp3", "oruga-detective.mp3", "oruga-pregunta-sombra.mp3", "oruga-a-mi-lado.mp3", "oruga-pregunta-pipo.mp3", "oruga-luciernagas.mp3", "oruga-circulos.mp3", "oruga-valientes.mp3", "oruga-otro-final.mp3", "pipo-uuuh.mp3", "pipo-perdido.mp3", "pipo-gracias.mp3", "mama-buho.mp3"].map(f => 'voces/' + f);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));       // lo imprescindible
    await Promise.all(VOICES.map(u => c.add(u).catch(() => {})));      // las voces, sin que un fallo rompa la instalación
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
async function rangeFrom(resp, range){
  const buf = await resp.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range) || [], s = +m[1] || 0, e = m[2] ? +m[2] : buf.byteLength - 1;
  return new Response(buf.slice(s, e + 1), { status: 206, headers: { 'Content-Type': resp.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${s}-${e}/${buf.byteLength}`, 'Content-Length': e - s + 1 } });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
    if (req.mode === 'navigate'){                                      // la página: primero la red, y sin conexión la guardada
      try { const r = await fetch(req); if (r.ok) cache.put('index.html', r.clone()); return r; }
      catch (_) { return (await cache.match('index.html')) || (await cache.match('./')) || Response.error(); }
    }
    if (hit){
      const range = req.headers.get('range');
      return range ? rangeFrom(hit, range) : hit;
    }
    try {
      const r = await fetch(req);
      if (r && (r.ok || r.type === 'opaque') && !req.headers.get('range')) cache.put(req, r.clone());
      return r;
    } catch (_) { return Response.error(); }
  })());
});
