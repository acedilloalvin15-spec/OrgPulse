// OrgPulse service worker: the app opens and works with no connection.
// Put this file next to index.html and serve both over HTTPS (or localhost).
const CACHE = "orgpulse-v2";
const SHELL = ["./", "./index.html", "./manifest.json"];
const FIREBASE = [
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // Firebase libraries are cached when the app is first installed online.
    // A failure here should not block the install.
    await Promise.all(FIREBASE.map((url) =>
      cache.add(new Request(url, { mode: "cors" })).catch((err) => console.warn("Precache skipped:", url, err))
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Live Firebase data and auth calls go straight to the network.
  // Firestore's own offline cache and queued writes handle those.
  if (url.hostname.endsWith("googleapis.com")) return;

  // Page loads: network first, then the cached app when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put("./index.html", res.clone()));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Scripts, styles, Firebase modules: cached copy first, refreshed in the background.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
