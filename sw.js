// Service worker : pré-cache des fichiers statiques pour jouer hors ligne.
// Incrémenter CACHE à chaque déploiement qui modifie un fichier de la liste.

const CACHE = "rush-hour-v2";
// "./" sert index.html ; on ne liste pas "index.html" séparément car certains
// serveurs statiques (dont `npx serve`) le redirigent vers "./".
const FILES = [
  "./",
  "manifest.webmanifest",
  "src/styles.css",
  "src/app.js",
  "src/game/board.js",
  "src/game/solver.js",
  "src/game/cards.js",
  "src/data/cards.js",
  "src/ui/render.js",
  "src/ui/input.js",
  "src/ui/colors.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      // Navigation absente du cache (ex. "/index.html", "/?x=1") : on sert la page "./"
      // pour que le jeu se recharge hors ligne quelle que soit l'URL d'entrée.
      if (request.mode === "navigate") {
        return caches.match("./").then((page) => page ?? fetch(request));
      }
      return fetch(request);
    }),
  );
});
