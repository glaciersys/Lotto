// ===== Service Worker: Network-First Caching =====
// กลยุทธ์: พยายามโหลดไฟล์ล่าสุดจากเน็ตก่อนเสมอ ถ้าสำเร็จจะอัปเดต cache ไปด้วย
// ถ้าออฟไลน์ (fetch fail) ค่อย fallback ไปใช้ไฟล์ที่ cache ไว้แทน
// ไม่ต้อง bump เลข version เอง เพราะไม่ได้ใช้ cache เป็นหลัก ใช้แค่เป็น fallback ตอนไม่มีเน็ต

const CACHE_NAME = 'lotto-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // เฉพาะ GET request ของ origin เดียวกันเท่านั้น (ไม่ยุ่งกับ flag icon จาก flagcdn.com ฯลฯ)
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
