// ════════════════════════════════════════════════════════════════════════
//  HazardAlert Service Worker
//  Handles push notifications for:
//  1. Hazard fixed near you
//  2. New critical hazard nearby
//  3. Your reported hazard was verified
// ════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'hazardalert-v1';
const OFFLINE_ASSETS = ['/', '/index.html', '/style.css', '/app.js'];

// ── Install: cache offline assets ───────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(OFFLINE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache if offline ──────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// ── Push Notification handler ────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: '🚨 HazardAlert', body: 'New activity on your hazard report', icon: '/favicon.ico', badge: '/favicon.ico' };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'hazardalert',
      requireInteraction: data.urgent || false,
      data: { url: data.url || '/' },
      actions: [
        { action: 'view', title: '👁️ View' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ]
    })
  );
});

// ── Notification click: open app ─────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes(location.origin));
      if (match) { match.focus(); match.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
