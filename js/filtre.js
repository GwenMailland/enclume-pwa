// Filtrage des secrets — appliqué à CHAQUE fichier chargé, avant tout rendu.
//  - supprime récursivement toute clé `secret` / `secrets` ;
//  - supprime toute entrée `connu: false` (élément de liste ou valeur d'objet) ;
//  - supprime les stats cachées non débloquées (`stats_cachees.*.debloquee: false`).
// `memoire.md` et `bugs.md` ne sont jamais demandés (voir FICHIERS_INTERDITS).

const CLES_SECRETES = new Set(["secret", "secrets"]);

export const FICHIERS_INTERDITS = ["memoire.md", "bugs.md"];

export function cheminInterdit(chemin) {
  const nom = String(chemin).split("?")[0].split("/").pop();
  return FICHIERS_INTERDITS.includes(nom);
}

function estObjet(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function inconnu(v) {
  return estObjet(v) && v.connu === false;
}

export function filtrer(valeur, cleParente = null) {
  if (Array.isArray(valeur)) {
    return valeur.filter((v) => !inconnu(v)).map((v) => filtrer(v));
  }
  if (!estObjet(valeur)) return valeur;

  const sortie = {};
  for (const [cle, v] of Object.entries(valeur)) {
    if (CLES_SECRETES.has(cle)) continue;
    if (inconnu(v)) continue;
    if (cleParente === "stats_cachees" && estObjet(v) && v.debloquee === false) continue;
    sortie[cle] = filtrer(v, cle);
  }
  return sortie;
}

// Parse un .jsonl ligne à ligne (une seule lecture), puis filtre chaque entrée.
export function parserJsonl(texte) {
  const entrees = [];
  for (const ligne of String(texte).split(/\r?\n/)) {
    const l = ligne.trim();
    if (!l) continue;
    try {
      const v = JSON.parse(l);
      if (!inconnu(v)) entrees.push(filtrer(v));
    } catch {
      // ligne corrompue : ignorée plutôt que de casser tout l'écran
    }
  }
  return entrees;
}
