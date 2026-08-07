const CACHE_NAME = "veritie-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    if (event.request.mode !== "navigate") {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(async () => {
            const cache = await caches.open(CACHE_NAME);
            const offlineResponse = await cache.match(OFFLINE_URL);
            if (offlineResponse) {
                return offlineResponse;
            }

            return new Response("You must be online to use Veritie.", {
                status: 503,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }),
    );
});
