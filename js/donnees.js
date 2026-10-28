// Source des données. Les chemins sont identiques en démo et en réel :
// seule la base change (demo/ ↔ API GitHub). Lecture seule : uniquement des GET.
import { filtrer, parserJsonl, cheminInterdit } from "./filtre.js";

const CLE_CONFIG = "enclume.config";
const CLE_SYNCHRO = "enclume.synchro";
const CONFIG_DEFAUT = { owner: "", repo: "enclume", branche: "main", token: "" };

export const FICHIERS_PARTIE = {
  partie: "partie.json",
  perso: "perso.json",
  inventaire: "inventaire.json",
  forge: "forge.json",
  ville: "ville.json",
  systeme: "systeme.json",
  destinee: "destinee.json",
  monde: "monde.json",
  pnj: "codex/pnj.json",
  lieux: "codex/lieux.json",
  factions: "codex/factions.json",
  bestiaire: "codex/bestiaire.json",
  objets: "codex/objets.json",
  noms: "codex/noms.json",
  quetes: "journal/quetes.json",
};

export const FICHIERS_JSONL = {
  chronologie: "journal/chronologie.jsonl",
  des: "journal/des.jsonl",
};

export class ErreurDonnees extends Error {
  constructor(message, statut = 0) {
    super(message);
    this.statut = statut;
  }
}

// ---------- Réglages (localStorage du téléphone uniquement) ----------

export function lireConfig() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_CONFIG) || "{}");
    return { ...CONFIG_DEFAUT, ...brut };
  } catch {
    return { ...CONFIG_DEFAUT };
  }
}

export function ecrireConfig(config) {
  const propre = {
    owner: String(config.owner || "").trim(),
    repo: String(config.repo || "").trim() || CONFIG_DEFAUT.repo,
    branche: String(config.branche || "").trim() || CONFIG_DEFAUT.branche,
    token: String(config.token || "").trim(),
  };
  localStorage.setItem(CLE_CONFIG, JSON.stringify(propre));
  viderCacheMemoire();
}

export function effacerConfig() {
  localStorage.removeItem(CLE_CONFIG);
  localStorage.removeItem(CLE_SYNCHRO);
  viderCacheMemoire();
}

export function modeDemo(config = lireConfig()) {
  return !config.token;
}

// ---------- Synchro ----------

function lireSynchros() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SYNCHRO) || "{}");
  } catch {
    return {};
  }
}

function cleSynchro(id) {
  const c = lireConfig();
  return modeDemo(c) ? `demo:${id}` : `${c.owner}/${c.repo}@${c.branche}:${id}`;
}

export function derniereSynchro(id) {
  return lireSynchros()[cleSynchro(id)] ?? null;
}

function noterSynchro(id) {
  const s = lireSynchros();
  s[cleSynchro(id)] = new Date().toISOString();
  try {
    localStorage.setItem(CLE_SYNCHRO, JSON.stringify(s));
  } catch {
    // stockage plein : la synchro ne sera simplement pas affichée
  }
}

// ---------- Lecture brute ----------

function urlDe(chemin, config) {
  if (modeDemo(config)) return new URL(`demo/${chemin}`, document.baseURI).href;
  const segments = chemin.split("/").map(encodeURIComponent).join("/");
  const owner = encodeURIComponent(config.owner);
  const repo = encodeURIComponent(config.repo);
  return `https://api.github.com/repos/${owner}/${repo}/contents/${segments}?ref=${encodeURIComponent(config.branche)}`;
}

function entetesDe(config) {
  if (modeDemo(config)) return {};
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github.raw+json",
  };
}

function messageHttp(statut) {
  if (statut === 401) return "Token refusé (401). Vérifie-le dans les Réglages.";
  if (statut === 403) return "Accès refusé ou quota d'API atteint (403).";
  if (statut === 404) return "Introuvable (404). Vérifie le propriétaire, le repo et la branche.";
  return `Erreur réseau (${statut}).`;
}

async function lire(chemin, { forcer = false, config = lireConfig() } = {}) {
  if (cheminInterdit(chemin)) throw new ErreurDonnees(`Lecture interdite : ${chemin}`);
  if (!modeDemo(config) && !config.owner) {
    throw new ErreurDonnees("Propriétaire du repo manquant. Complète les Réglages.");
  }
  let rep;
  try {
    rep = await fetch(urlDe(chemin, config), {
      method: "GET",
      headers: entetesDe(config),
      cache: forcer ? "no-cache" : "default",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  } catch {
    throw new ErreurDonnees("Hors ligne et aucune copie en cache.");
  }
  if (rep.status === 404) return { absent: true, depuisCache: false };
  if (!rep.ok) throw new ErreurDonnees(messageHttp(rep.status), rep.status);
  return { texte: await rep.text(), depuisCache: rep.headers.get("X-Enclume-Cache") === "1" };
}

async function lireJson(chemin, options) {
  const r = await lire(chemin, options);
  if (r.absent) return { valeur: null, depuisCache: false };
  let brut;
  try {
    brut = JSON.parse(r.texte);
  } catch {
    throw new ErreurDonnees(`Fichier illisible : ${chemin}`);
  }
  return { valeur: filtrer(brut), depuisCache: r.depuisCache };
}

async function lireJsonl(chemin, options) {
  const r = await lire(chemin, options);
  if (r.absent) return { valeur: [], depuisCache: false };
  return { valeur: parserJsonl(r.texte), depuisCache: r.depuisCache };
}

// ---------- Mode debug : vérification de schema_version ----------

export const debug = new URLSearchParams(location.search).get("debug") === "1";
let versionAttendue = null;
const avertissements = [];

export function lireAvertissements() {
  return [...avertissements];
}

async function verifierVersion(nom, valeur) {
  if (!debug || !valeur || typeof valeur !== "object" || Array.isArray(valeur)) return;
  if (versionAttendue === null) {
    try {
      const commun = await (await fetch("schemas/commun.schema.json")).json();
      versionAttendue = commun.$defs?.schema_version?.const ?? 1;
    } catch {
      versionAttendue = 1;
    }
  }
  if (valeur.schema_version !== versionAttendue) {
    avertissements.push(`${nom} : schema_version ${valeur.schema_version ?? "absente"} ≠ ${versionAttendue} attendue`);
  }
}

// ---------- API publique ----------

const cacheMemoire = new Map();

export function viderCacheMemoire() {
  cacheMemoire.clear();
}

export async function chargerIndex({ forcer = false } = {}) {
  const cle = "__index__";
  if (!forcer && cacheMemoire.has(cle)) return cacheMemoire.get(cle);
  const { valeur, depuisCache } = await lireJson("parties/index.json", { forcer });
  await verifierVersion("index.json", valeur);
  if (!depuisCache) noterSynchro(cle);
  const resultat = { parties: valeur?.parties ?? [], horsLigne: depuisCache, synchro: derniereSynchro(cle) };
  cacheMemoire.set(cle, resultat);
  return resultat;
}

export async function chargerPartie(id, { forcer = false } = {}) {
  if (!forcer && cacheMemoire.has(id)) return cacheMemoire.get(id);
  const base = `parties/${id}/`;
  const options = { forcer };
  const json = Object.entries(FICHIERS_PARTIE).map(async ([cle, f]) => [cle, await lireJson(base + f, options)]);
  const jsonl = Object.entries(FICHIERS_JSONL).map(async ([cle, f]) => [cle, await lireJsonl(base + f, options)]);
  const resultats = await Promise.all([...json, ...jsonl]);

  const donnees = { id };
  let horsLigne = false;
  for (const [cle, { valeur, depuisCache }] of resultats) {
    donnees[cle] = valeur;
    horsLigne ||= depuisCache;
    if (cle in FICHIERS_PARTIE) await verifierVersion(FICHIERS_PARTIE[cle], valeur);
  }
  if (!donnees.partie || !donnees.perso) {
    throw new ErreurDonnees("Partie incomplète : partie.json ou perso.json manquant.");
  }
  if (!horsLigne) noterSynchro(id);
  const resultat = { donnees, horsLigne, synchro: derniereSynchro(id), sessions: new Map() };
  cacheMemoire.set(id, resultat);
  return resultat;
}

export function numeroSession(n) {
  return String(n).padStart(3, "0");
}

// Résumé de session (markdown). null si absent.
export async function chargerSession(id, n, { forcer = false } = {}) {
  const charge = cacheMemoire.get(id);
  if (!forcer && charge?.sessions.has(n)) return charge.sessions.get(n);
  const r = await lire(`parties/${id}/journal/sessions/${numeroSession(n)}.md`, { forcer });
  const texte = r.absent ? null : r.texte;
  charge?.sessions.set(n, texte);
  return texte;
}

// Test de connexion avec une configuration non encore enregistrée.
export async function testerConnexion(config) {
  const c = { ...CONFIG_DEFAUT, ...config };
  if (modeDemo(c)) throw new ErreurDonnees("Aucun token saisi : c'est le mode démo.");
  const r = await lire("parties/index.json", { forcer: true, config: c });
  if (r.absent) return "Connexion réussie, mais parties/index.json est introuvable sur cette branche.";
  let n = 0;
  try {
    n = (JSON.parse(r.texte).parties ?? []).length;
  } catch {
    return "Connexion réussie, mais index.json est illisible.";
  }
  return `Connexion réussie : ${n} partie${n > 1 ? "s" : ""} trouvée${n > 1 ? "s" : ""}.`;
}

export async function viderTousLesCaches() {
  viderCacheMemoire();
  if ("caches" in window) {
    const cles = await caches.keys();
    await Promise.all(cles.filter((k) => k.startsWith("enclume-donnees")).map((k) => caches.delete(k)));
  }
}
