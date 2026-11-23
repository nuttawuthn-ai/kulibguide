/*
 * Service worker: ให้แอปเปิดได้แม้สัญญาณอินเทอร์เน็ตในอาคารไม่ดี
 * - ไฟล์ของแอป: ใช้ข้อมูลใหม่จากเครือข่ายก่อน ถ้าออฟไลน์ใช้สำเนาที่เก็บไว้
 *   (เมื่ออัปเดต data.js บน GitHub ผู้ใช้จะได้ข้อมูลใหม่ทันทีที่ออนไลน์)
 * - ฟอนต์: ใช้สำเนาที่เก็บไว้ก่อน
 */
const CACHE = "kulib-tour-v7";
const ASSETS = ["./", "index.html", "styles.css", "app.js", "config.js", "data.js", "content.js", "icon.svg", "icon-192.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
