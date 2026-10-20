/**
 * Lactae service worker — assets statiques uniquement.
 *
 * Les pages HTML et les payloads RSC embarquent des données utilisateur
 * (tirages, journal). Les mettre en cache provoque des listes obsolètes :
 * entrée absente juste après un ajout, ou flash puis disparition quand un
 * payload RSC périmé écrase le HTML frais.
 *
 * Ne jamais re-cacher `/`, `/journal`, etc. ni les requêtes RSC / prefetch.
 */
const CACHE = "lactae-v6";

/** Ferme toutes les notifications affichées par cette web app. */
function clearAllNotifications() {
  return self.registration.getNotifications().then((notifications) => {
    for (const notification of notifications) {
      notification.close();
    }
  });
}

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (STATIC_ASSETS.includes(url.pathname)) return true;
  if (url.pathname.startsWith("/icons/")) return true;
  return /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(url.pathname);
}

/** HTML, RSC, prefetch App Router, API : toujours réseau, jamais Cache API. */
function isUncacheableRequest(request, url) {
  if (url.pathname.startsWith("/api/")) return true;
  if (request.mode === "navigate") return true;
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.has("Next-Router-State-Tree")) return true;
  if (request.headers.has("Next-Router-Prefetch")) return true;
  if (request.headers.has("Next-Url")) return true;
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) return true;
  if (accept.includes("text/x-component")) return true;
  // Tout /_next/ hors /_next/static/ (flight, data, HMR, …)
  if (
    url.pathname.startsWith("/_next/") &&
    !url.pathname.startsWith("/_next/static/")
  ) {
    return true;
  }
  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_NOTIFICATIONS") {
    event.waitUntil(clearAllNotifications());
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Lactae",
    body: "",
    url: "/",
  };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    /* payload non JSON */
  }

  // Tag unique : remplace la notif précédente au lieu d’empiler (Android).
  // Sur iOS le tag est moins fiable → clear côté app à l’ouverture / tirage.
  event.waitUntil(
    self.registration.showNotification(data.title || "Lactae", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
      tag: "lactae",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl =
    (event.notification.data && event.notification.data.url) || "/";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            if ("navigate" in client) {
              return client.navigate(targetUrl).then((c) => (c || client).focus());
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      },
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Données dynamiques : réseau uniquement (pas de repli HTML périmé).
  if (isUncacheableRequest(request, url)) {
    event.respondWith(
      fetch(request).catch(() => {
        if (request.mode === "navigate") {
          return new Response(
            "<!DOCTYPE html><html lang=fr><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Lactae</title></head><body style=\"font-family:system-ui;padding:2rem;background:#faf6f1;color:#5c4a45\"><h1>Hors ligne</h1><p>Reconnectez-vous pour voir vos tirages et votre journal à jour.</p></body></html>",
            {
              status: 503,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
              },
            },
          );
        }
        return Response.error();
      }),
    );
    return;
  }

  // Assets immuables / icônes : cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetched;
      }),
    );
  }
});
