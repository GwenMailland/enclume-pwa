// Service worker — hors ligne.
//  - coquille : mise en cache à l'installation, servie depuis le cache puis rafraîchie ;
//  - données (demo/ ou api.github.com) : réseau d'abord, repli sur le dernier état
//    chargé, marqué par l'en-tête X-Enclume-Cache: 1 ;
//  - polices Google : cache d'abord.
// Lecture seule : seules les requêtes GET sont interceptées.

const VERSION = "1.0.0";
const CACHE_COQUILLE = `enclume-coquille-${VERSION}`;
const CACHE_DONNEES = "enclume-donnees-v1";
const CACHE_POLICES = "enclume-polices-v1";

const COQUILLE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/tokens.css",
  "css/base.css",
  "css/composants.css",
  "js/app.js",
  "js/version.js",
  "js/routeur.js",
  "js/donnees.js",
  "js/filtre.js",
  "js/regles.js",
  "js/references.js",
  "js/markdown.js",
  "js/ui/dom.js",
  "js/ui/libelles.js",
  "js/ui/accueil.js",
  "js/ui/heros.js",
  "js/ui/sac.js",
  "js/ui/codex.js",
  "js/ui/journal.js",
  "js/ui/plus.js",
  "js/ui/systeme.js",
  "js/ui/ville.js",
  "js/ui/destinee.js",
  "js/ui/jets.js",
  "js/ui/reglages.js",
  "icons/icone.svg",
  "icons/icone-192.png",
  "icons/icone-512.png",
  "icons/apple-touch-icon.png",
];

const INTERDITS = /\/(memoire|bugs)\.md(\?|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_COQUILLE)
      .then((c) => c.addAll(COQUILLE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((k) => k.startsWith("enclume-coquille-") && k !== CACHE_COQUILLE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function estDonnee(url) {
  if (url.hostname === "api.github.com") return url.pathname.includes("/contents/parties/");
  return url.origin === self.location.origin && url.pathname.includes("/demo/parties/");
}

async function reseauDabord(requete) {
  const cache = await caches.open(CACHE_DONNEES);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) await cache.put(requete, reponse.clone());
    return reponse;
  } catch (err) {
    const copie = await cache.match(requete);
    if (!copie) throw err;
    const entetes = new Headers(copie.headers);
    entetes.set("X-Enclume-Cache", "1");
    return new Response(await copie.blob(), { status: copie.status, statusText: copie.statusText, headers: entetes });
  }
}

async function cacheDabord(requete, nomCache) {
  const cache = await caches.open(nomCache);
  const copie = await cache.match(requete);
  if (copie) return copie;
  const reponse = await fetch(requete);
  if (reponse.ok || reponse.type === "opaque") await cache.put(requete, reponse.clone());
  return reponse;
}

async function coquille(requete) {
  const cache = await caches.open(CACHE_COQUILLE);
  const copie = await cache.match(requete, { ignoreSearch: true });
  const frais = fetch(requete)
    .then((r) => {
      if (r.ok) cache.put(requete, r.clone());
      return r;
    })
    .catch(() => null);
  if (copie) return copie;
  const r = await frais;
  if (r) return r;
  if (requete.mode === "navigate") return (await cache.match("index.html")) ?? Response.error();
  return Response.error();
}

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);
  if (INTERDITS.test(url.pathname)) {
    event.respondWith(new Response("Interdit", { status: 403 }));
    return;
  }
  if (estDonnee(url)) {
    event.respondWith(reseauDabord(requete));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheDabord(requete, CACHE_POLICES));
  } else if (url.origin === self.location.origin) {
    event.respondWith(coquille(requete));
  }
});
