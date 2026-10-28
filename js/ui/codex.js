// Codex — PNJ, lieux, factions, bestiaire, objets, noms ; recherche globale.
import { h, carte, fenetre, sectionTitre, vide, definitions, puce, jaugeCentree, vider, normaliser } from "./dom.js";
import { libelle, ORDRE_QUALITES } from "./libelles.js";

const SOUS = [
  ["pnj", "PNJ"],
  ["lieux", "Lieux"],
  ["factions", "Factions"],
  ["bestiaire", "Bestiaire"],
  ["objets", "Objets"],
  ["noms", "Noms"],
];

let requete = "";

function entrees(d, type) {
  return d[type]?.entrees ?? [];
}

function signeAffinite(v) {
  return v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0";
}

// ---------- Cartes de liste ----------

function sousTitre(d, type, e, refs) {
  switch (type) {
    case "pnj":
      return [e.role, refs.nom(e.lieu), e.vivant === false ? "✝ mort" : null].filter(Boolean).join(" · ");
    case "lieux":
      return [libelle("type_lieu", e.type), refs.nom(e.region), e.rang_danger ? `danger ${e.rang_danger}` : null].filter(Boolean).join(" · ");
    case "factions":
      return [e.rang_heros ? `Rang : ${e.rang_heros}` : null, `réputation ${signeAffinite(e.reputation ?? 0)}`].filter(Boolean).join(" · ");
    case "bestiaire":
      return [`Rang ${e.rang}`, libelle("type_bestiaire", e.type), e.boss ? "boss" : null, e.vaincus ? `${e.vaincus} vaincu${e.vaincus > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ");
    case "objets":
      return [libelle("type_objet", e.type), libelle("qualite", e.qualite)].filter(Boolean).join(" · ");
    default:
      return "";
  }
}

function carteEntree(d, type, e, refs) {
  const droite =
    type === "pnj"
      ? puce(libelle("statut_pnj", e.statut), e.affinite > 30 ? "ok" : e.affinite < 0 ? "danger" : "")
      : type === "objets"
        ? h("span", { class: "badge-qualite", dataset: { qualite: e.qualite } }, libelle("qualite", e.qualite))
        : h("span", { class: "chevron", "aria-hidden": "true" }, "›");
  return h(
    "a",
    { class: `carte ${type === "objets" ? "objet" : ""}`.trim(), href: `${refs.base}/codex/${type}/${encodeURIComponent(e.id)}`, dataset: type === "objets" ? { qualite: e.qualite } : null },
    h("div", { class: "carte-tete" }, h("div", null, h("h3", { class: type === "objets" ? "qualite-texte" : null }, e.nom), h("p", { class: "meta" }, sousTitre(d, type, e, refs))), droite),
  );
}

// ---------- Fiches ----------

function liste(items, rendu) {
  if (!items?.length) return null;
  return h("ul", { class: "liste serree" }, items.map((i) => h("li", null, rendu(i))));
}

function datesSouvenirs(souvenirs) {
  return h(
    "ul",
    { class: "frise" },
    [...souvenirs].sort((a, b) => (a.jour ?? 0) - (b.jour ?? 0)).map((s) => h("li", { dataset: { importance: "1" } }, h("div", { class: "date" }, `Jour ${s.jour}`), h("p", { class: "petit" }, s.texte))),
  );
}

function fichePnj(d, e, refs) {
  return [
    carte(
      h("div", { class: "carte-tete" }, h("div", null, h("h1", { style: { fontSize: "1.75rem" } }, e.nom), h("p", { class: "meta" }, [e.role, e.metier].filter(Boolean).join(" · "))), puce(libelle("statut_pnj", e.statut), "cuivre")),
      e.vivant === false ? h("p", { class: "petit", style: { marginTop: "6px", color: "var(--danger)" } }, "✝ Mort") : null,
      e.apparence ? h("p", { class: "recit", style: { marginTop: "10px" } }, e.apparence) : null,
    ),
    fenetre(
      "Affinité",
      signeAffinite(e.affinite ?? 0),
      jaugeCentree(e.affinite ?? 0),
      h("div", { class: "ligne tres-petit discret", style: { minHeight: "auto", marginTop: "4px" } }, h("span", null, "−100"), h("span", null, "0"), h("span", null, "+100")),
    ),
    carte(
      definitions([
        ["Lieu", refs.lien(e.lieu)],
        ["Faction", refs.lien(e.faction)],
        ["Culture", e.culture ? libelle("", e.culture) : null],
        ["Trait", e.trait],
        ["Désir", e.desir],
        ["Peur", e.peur],
        ["Rencontre", e.premiere_rencontre_jour ? `jour ${e.premiere_rencontre_jour}` : null],
      ]),
    ),
    e.voix ? h("div", null, sectionTitre("Voix"), carte(h("p", { class: "recit" }, e.voix))) : null,
    e.dernier_echange ? h("div", null, sectionTitre("Dernier échange", `jour ${e.dernier_echange.jour}`), carte(h("p", { class: "citation" }, e.dernier_echange.texte))) : null,
    e.souvenirs?.length ? h("div", null, sectionTitre("Souvenirs"), carte(datesSouvenirs(e.souvenirs))) : null,
    lienSection("Liens", e.liens, (l) => ({ cible: l.cible, texte: l.nature }), refs),
  ];
}

function lienSection(titre, items, extraire, refs) {
  const lignes = (items ?? [])
    .map(extraire)
    .map(({ cible, texte, droite }) => {
      const lien = refs.lien(cible);
      if (!lien) return null; // cible inconnue du joueur : rien n'est affiché
      return h("div", { class: "ligne" }, h("div", null, lien, texte ? h("p", { class: "tres-petit discret" }, texte) : null), droite ?? null);
    })
    .filter(Boolean);
  if (!lignes.length) return null;
  return h("div", null, sectionTitre(titre), carte(h("ul", { class: "liste serree" }, lignes.map((l) => h("li", null, l)))));
}

function ficheLieu(d, e, refs) {
  const pnjIci = entrees(d, "pnj").filter((p) => p.lieu === e.id);
  return [
    carte(
      h("h1", { style: { fontSize: "1.75rem" } }, e.nom),
      h("p", { class: "meta" }, [libelle("type_lieu", e.type), refs.nom(e.region)].filter(Boolean).join(" · ")),
      e.description ? h("p", { class: "recit", style: { marginTop: "10px" } }, e.description) : null,
    ),
    carte(
      definitions([
        ["Région", refs.lien(e.region)],
        ["État", libelle("etat_lieu", e.etat)],
        ["Contrôle", refs.lien(e.controle_par)],
        ["Danger", e.rang_danger ? `rang ${e.rang_danger}` : null],
        ["Visité", e.visite_jour ? `jour ${e.visite_jour}` : null],
      ]),
    ),
    e.decouvertes?.length ? h("div", null, sectionTitre("Découvertes"), carte(liste(e.decouvertes, (t) => h("p", { class: "petit" }, "✦ ", t)))) : null,
    lienSection("Personnes ici", pnjIci, (p) => ({ cible: p.id, texte: p.role }), refs),
  ];
}

function ficheFaction(d, e, refs) {
  const membres = entrees(d, "pnj").filter((p) => p.faction === e.id);
  return [
    carte(h("h1", { style: { fontSize: "1.75rem" } }, e.nom), e.description ? h("p", { class: "recit", style: { marginTop: "8px" } }, e.description) : null),
    fenetre(
      "Réputation",
      signeAffinite(e.reputation ?? 0),
      jaugeCentree(e.reputation ?? 0),
      e.rang_heros ? h("p", { class: "petit", style: { marginTop: "8px" } }, "Ton rang : ", h("strong", null, e.rang_heros)) : null,
    ),
    carte(
      definitions([
        ["But", e.but],
        ["Ressource", e.ressource],
        ["Méthode", e.methode],
        ["Siège", refs.lien(e.siege)],
      ]),
    ),
    lienSection("Relations", e.relations, (r) => ({ cible: r.faction, droite: h("span", { class: `mono droite ${r.valeur < 0 ? "" : ""}`, style: { color: r.valeur < 0 ? "var(--danger)" : r.valeur > 0 ? "var(--ok)" : "var(--texte-2)" } }, signeAffinite(r.valeur)) }), refs),
    lienSection("Membres connus", membres, (p) => ({ cible: p.id, texte: p.role }), refs),
  ];
}

function ficheBestiaire(d, e) {
  const tuile = (et, v) => h("div", { class: "case" }, h("span", { class: "etiquette" }, et), h("span", { class: "chiffre" }, v ?? "—"));
  return [
    carte(
      h("div", { class: "carte-tete" }, h("h1", { style: { fontSize: "1.75rem" } }, e.nom), e.boss ? puce("Boss", "danger") : null),
      h("p", { class: "meta" }, [`Rang ${e.rang}`, libelle("type_bestiaire", e.type)].join(" · ")),
      e.description ? h("p", { class: "recit", style: { marginTop: "10px" } }, e.description) : null,
    ),
    fenetre("Analyse", null, h("div", { class: "grille-2" }, tuile("PV", e.pv), tuile("Défense", e.defense), tuile("Attaque", e.attaque !== undefined ? `+${e.attaque}` : null), tuile("Dégâts", e.degats))),
    carte(
      definitions([
        ["Capacités", e.capacites?.join(" · ")],
        ["Faiblesses", e.faiblesses?.join(", ")],
        ["Résistances", e.resistances?.join(", ")],
        ["Rencontres", e.rencontres !== undefined ? String(e.rencontres) : null],
        ["Vaincus", e.vaincus !== undefined ? String(e.vaincus) : null],
        ["Première fois", e.premiere_rencontre_jour ? `jour ${e.premiere_rencontre_jour}` : null],
      ]),
    ),
  ];
}

function ficheObjetCodex(d, e, refs) {
  const possede = (d.inventaire?.objets ?? []).some((o) => o.id === e.id);
  const porteur = e.porteur === "heros" ? `${d.perso?.nom ?? "Toi"} (toi)` : refs.nom(e.porteur);
  const createur = e.createur === "heros" ? `${d.perso?.nom ?? "Toi"} (toi)` : e.createur ? refs.nom(e.createur) : e.createur === null ? "Inconnu" : null;
  return [
    h(
      "div",
      { class: "carte objet", dataset: { qualite: e.qualite } },
      h("div", { class: "carte-tete" }, h("h1", { class: "qualite-texte", style: { fontSize: "1.75rem" } }, e.nom), h("span", { class: "badge-qualite" }, libelle("qualite", e.qualite))),
      h("p", { class: "meta" }, libelle("type_objet", e.type)),
      e.description ? h("p", { class: "recit", style: { marginTop: "10px" } }, e.description) : null,
    ),
    carte(
      definitions([
        ["Porteur", porteur],
        ["Créateur", createur],
        ["Lieu", refs.lien(e.lieu)],
        ["Découvert", e.decouvert_jour ? `jour ${e.decouvert_jour}` : null],
      ]),
    ),
    e.histoire ? h("div", null, sectionTitre("Histoire"), carte(h("p", { class: "citation" }, e.histoire))) : null,
    possede ? h("div", { class: "actions" }, h("a", { class: "btn", href: `${refs.base}/sac/objet/${encodeURIComponent(e.id)}` }, "Voir dans le sac")) : null,
  ];
}

const FICHES = { pnj: fichePnj, lieux: ficheLieu, factions: ficheFaction, bestiaire: ficheBestiaire, objets: ficheObjetCodex };

// ---------- Listes par sous-onglet ----------

function listeType(d, type, refs) {
  if (type === "noms") return listeNoms(d, refs, d.noms?.noms ?? []);
  let items = [...entrees(d, type)];
  if (type === "objets") items.sort((a, b) => ORDRE_QUALITES.indexOf(b.qualite) - ORDRE_QUALITES.indexOf(a.qualite));
  else if (type === "pnj") items.sort((a, b) => (b.affinite ?? 0) - (a.affinite ?? 0));
  else items.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const blocs = [];
  if (type === "lieux") blocs.push(blocMonde(d));
  if (!items.length) blocs.push(vide("Aucune entrée pour l'instant.", "📖"));
  else blocs.push(...items.map((e) => carteEntree(d, type, e, refs)));
  return blocs;
}

function blocMonde(d) {
  const m = d.monde;
  if (!m) return null;
  const regions = m.regions ?? [];
  return h(
    "div",
    { style: { marginBottom: "12px" } },
    carte(
      h("h3", null, m.nom ?? "Le monde"),
      m.ton ? h("p", { class: "meta" }, libelle("ton", m.ton)) : null,
      m.lore ? h("p", { class: "recit", style: { marginTop: "8px" } }, m.lore) : null,
    ),
    regions.length ? sectionTitre("Régions", String(regions.length)) : null,
    regions.length
      ? carte(
          h(
            "ul",
            { class: "liste" },
            regions.map((r) =>
              h(
                "li",
                null,
                h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, r.nom), h("span", { class: "puce droite" }, `Rang ${r.rang}`)),
                h("p", { class: "tres-petit discret" }, [r.biome, r.culture].filter(Boolean).join(" · ")),
                r.description ? h("p", { class: "petit", style: { marginTop: "2px" } }, r.description) : null,
              ),
            ),
          ),
        )
      : null,
    sectionTitre("Lieux"),
  );
}

function listeNoms(d, refs, noms) {
  const tries = [...noms].sort((a, b) => normaliser(a.nom).localeCompare(normaliser(b.nom), "fr"));
  if (!tries.length) return [vide("Le dictionnaire est vide.", "📖")];
  const parLettre = new Map();
  for (const n of tries) {
    const l = normaliser(n.nom).charAt(0).toUpperCase() || "#";
    if (!parLettre.has(l)) parLettre.set(l, []);
    parLettre.get(l).push(n);
  }
  return [...parLettre].map(([lettre, groupe]) =>
    h(
      "div",
      null,
      h("h3", { style: { margin: "14px 0 4px", color: "var(--cuivre)" } }, lettre),
      carte(
        h(
          "ul",
          { class: "liste serree" },
          groupe.map((n) => {
            const cible = refs.trouver(n.ref);
            const corps = [h("span", null, n.nom), h("span", { class: "puce droite" }, libelle("type_nom", n.type))];
            return h("li", null, cible?.href ? h("a", { class: "ligne", href: cible.href, style: { color: "var(--texte)" } }, ...corps) : h("div", { class: "ligne" }, ...corps));
          }),
        ),
      ),
    ),
  );
}

// ---------- Recherche ----------

function rechercher(d, refs, q) {
  const n = normaliser(q.trim());
  const blocs = [];
  for (const [type, lib] of SOUS) {
    if (type === "noms") continue;
    const trouves = entrees(d, type).filter((e) => normaliser([e.nom, e.role, e.description, e.metier, e.but].filter(Boolean).join(" ")).includes(n));
    if (trouves.length) blocs.push(sectionTitre(lib, String(trouves.length)), ...trouves.map((e) => carteEntree(d, type, e, refs)));
  }
  const noms = (d.noms?.noms ?? []).filter((x) => normaliser(x.nom).includes(n));
  if (noms.length) blocs.push(sectionTitre("Noms", String(noms.length)), ...listeNoms(d, refs, noms));
  return blocs.length ? blocs : [vide(`Rien ne répond au nom de « ${q.trim()} ».`, "🔍")];
}

export function rendre({ d, refs, reste }) {
  const sous = SOUS.some(([k]) => k === reste[0]) ? reste[0] : "pnj";
  const idFiche = reste[1];

  if (idFiche && FICHES[sous]) {
    const e = entrees(d, sous).find((x) => x.id === idFiche);
    const contenu = e ? h("div", null, ...FICHES[sous](d, e, refs).filter(Boolean)) : vide("Cette entrée n'est pas au codex.", "📖");
    // espacement homogène entre blocs
    for (const enfant of contenu.children) if (enfant !== contenu.firstElementChild && !enfant.style.marginTop) enfant.style.marginTop = "12px";
    return { titre: e?.nom ?? "Codex", retour: `${refs.base}/codex/${sous}`, contenu };
  }

  const resultats = h("div");
  const remplir = () => {
    vider(resultats);
    resultats.append(...(requete.trim() ? rechercher(d, refs, requete) : listeType(d, sous, refs)).filter(Boolean));
  };
  remplir();

  const recherche = h("input", {
    class: "recherche",
    type: "search",
    placeholder: "Chercher dans tout le codex…",
    "aria-label": "Recherche dans le codex",
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
    value: requete,
    oninput: (e) => {
      requete = e.target.value;
      onglets.style.display = requete.trim() ? "none" : "";
      remplir();
    },
  });

  const onglets = h(
    "nav",
    { class: "segments trois-col", "aria-label": "Sections du codex", style: { display: requete.trim() ? "none" : "" } },
    SOUS.map(([k, lib]) => h("a", { href: `${refs.base}/codex/${k}`, "aria-current": k === sous ? "page" : null }, lib)),
  );

  const contenu = h("div", null, h("h1", { style: { fontSize: "1.75rem", marginBottom: "10px" } }, "Codex"), h("div", { style: { marginBottom: "12px" } }, recherche), onglets, resultats);
  return { titre: d.partie?.nom ?? "Codex", retour: "#/", contenu };
}
