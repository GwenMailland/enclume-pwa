// Résolution des références par ID → { nom, href }.
// Règle : on n'affiche JAMAIS un id brut (il peut contenir un nom secret,
// ex. lieu_forge_sans_flamme_f001). Un id introuvable dans les données
// filtrées est considéré comme inconnu du joueur.
import { h } from "./ui/dom.js";

export function construireReferences(d, pid) {
  const base = `#/p/${encodeURIComponent(pid)}`;
  const table = new Map();
  const poser = (id, nom, href = null) => {
    if (id && nom && !table.has(id)) table.set(id, { nom, href });
  };

  if (d.perso) {
    poser("heros", d.perso.nom, `${base}/heros`);
    if (d.perso.classe) poser(d.perso.classe.id, d.perso.classe.nom, `${base}/heros`);
    for (const c of d.perso.competences ?? []) poser(c.id, c.nom, `${base}/heros`);
    for (const t of d.perso.titres?.obtenus ?? []) poser(t.id, t.nom, `${base}/heros`);
  }
  for (const o of d.inventaire?.objets ?? []) poser(o.id, o.nom, `${base}/sac/objet/${encodeURIComponent(o.id)}`);
  for (const m of d.inventaire?.materiaux ?? []) poser(m.id, m.nom, `${base}/sac/materiaux`);
  for (const r of d.forge?.recettes ?? []) {
    poser(r.id, r.nom, `${base}/sac/forge`);
    for (const m of r.materiaux ?? []) poser(m.id, m.nom);
  }
  for (const c of d.forge?.historique ?? []) for (const m of c.materiaux ?? []) poser(m.id, m.nom);

  const codex = [
    ["pnj", d.pnj],
    ["lieux", d.lieux],
    ["factions", d.factions],
    ["bestiaire", d.bestiaire],
    ["objets", d.objets],
  ];
  for (const [type, fichier] of codex) {
    for (const e of fichier?.entrees ?? []) poser(e.id, e.nom, `${base}/codex/${type}/${encodeURIComponent(e.id)}`);
  }
  for (const r of d.monde?.regions ?? []) poser(r.id, r.nom, `${base}/codex/lieux`);
  for (const f of d.monde?.fronts ?? []) poser(f.id, f.nom, `${base}/destinee`);
  for (const b of d.systeme?.breches ?? []) poser(b.id, b.nom, `${base}/systeme`);
  for (const q of d.systeme?.quetes ?? []) poser(q.id, q.titre, `${base}/systeme`);
  for (const q of d.quetes?.quetes ?? []) poser(q.id, q.titre, `${base}/journal/quetes`);
  for (const c of d.destinee?.choix ?? []) poser(c.id, c.titre, `${base}/destinee`);
  for (const b of d.ville?.batiments ?? []) poser(b.id, b.nom, `${base}/ville`);

  return {
    base,
    trouver: (id) => (id ? table.get(id) ?? null : null),
    nom: (id, defaut = "") => (id ? table.get(id)?.nom ?? defaut : defaut),
    // Nœud : lien si possible, sinon texte, sinon `defaut` (null = rien).
    lien(id, defaut = null) {
      const r = id ? table.get(id) : null;
      if (!r) return defaut;
      return r.href ? h("a", { href: r.href }, r.nom) : document.createTextNode(r.nom);
    },
  };
}
