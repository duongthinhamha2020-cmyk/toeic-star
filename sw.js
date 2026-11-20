// Service worker: cho phép mở app khi mất mạng. Không đụng tới các cuộc gọi AI (Gemini/Claude).
const V = "toeic-star-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;
  if (isFont) {
    e.respondWith(
      caches.open(V).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }
  // Trang và tệp của app: ưu tiên mạng để luôn mới, mất mạng thì dùng bản lưu
  e.respondWith(
    fetch(req)
      .then((r) => { const copy = r.clone(); caches.open(V).then((c) => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});
