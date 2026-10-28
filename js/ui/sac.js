// Sac — équipement, inventaire, matériaux, forge et fiche d'objet.
import { h, carte, fenetre, barre, sectionTitre, segments, vide, definitions, puce, vider } from "./dom.js";
import { libelle, texteBonus, chiffresRomains, ORDRE_QUALITES, pluriel } from "./libelles.js";

const EMPLACEMENTS = ["arme_principale", "arme_secondaire", "tete", "torse", "mains", "jambes", "pieds", "amulette", "anneau_1", "anneau_2"];
const filtres = { type: "", qualite: "" };

function objetsParId(d) {
  return new Map((d.inventaire?.objets ?? []).map((o) => [o.id, o]));
}

function emplacementsPortes(d, id) {
  return Object.entries(d.inventaire?.equipement ?? {})
    .filter(([, v]) => v === id)
    .map(([k]) => k);
}

function lienObjet(base, o, ...extra) {
  return h(
    "a",
    { class: "carte objet", href: `${base}/sac/objet/${encodeURIComponent(o.id)}`, dataset: { qualite: o.qualite } },
    h(
      "div",
      { class: "carte-tete" },
      h(
        "div",
        null,
        h("div", { class: "nom" }, o.nom, o.quantite > 1 ? h("span", { class: "discret mono petit" }, ` ×${o.quantite}`) : null),
        h("p", { class: "meta" }, [libelle("type_objet", o.type), o.sous_type].filter(Boolean).join(" · ")),
        ...extra,
      ),
      h("span", { class: "badge-qualite" }, libelle("qualite", o.qualite)),
    ),
  );
}

function ecranEquipement(d, base) {
  const parId = objetsParId(d);
  const eq = d.inventaire?.equipement ?? {};
  return carte(
    h(
      "ul",
      { class: "liste" },
      EMPLACEMENTS.map((emp) => {
        const o = eq[emp] ? parId.get(eq[emp]) : null;
        return h(
          "li",
          null,
          o
            ? h(
                "a",
                { class: "ligne", href: `${base}/sac/objet/${encodeURIComponent(o.id)}`, dataset: { qualite: o.qualite } },
                h("div", null, h("span", { class: "tres-petit discret", style: { display: "block" } }, libelle("emplacement", emp)), h("span", { class: "qualite-texte", style: { fontWeight: 600 } }, o.nom)),
                h("span", { class: "chevron", "aria-hidden": "true" }, "›"),
              )
            : h(
                "div",
                { class: "ligne" },
                h("div", null, h("span", { class: "tres-petit discret", style: { display: "block" } }, libelle("emplacement", emp)), h("span", { class: "tres-discret" }, "— vide —")),
              ),
        );
      }),
    ),
  );
}

function ecranInventaire(d, base) {
  const objets = d.inventaire?.objets ?? [];
  const types = [...new Set(objets.map((o) => o.type))];
  const qualites = ORDRE_QUALITES.filter((q) => objets.some((o) => o.qualite === q));
  const liste = h("div");

  const remplir = () => {
    vider(liste);
    const choisis = objets
      .filter((o) => (!filtres.type || o.type === filtres.type) && (!filtres.qualite || o.qualite === filtres.qualite))
      .sort((a, b) => ORDRE_QUALITES.indexOf(b.qualite) - ORDRE_QUALITES.indexOf(a.qualite));
    if (!choisis.length) {
      liste.append(vide("Rien de tel dans ton sac.", "🎒"));
      return;
    }
    for (const o of choisis) {
      const portes = emplacementsPortes(d, o.id);
      liste.append(lienObjet(base, o, portes.length ? h("p", { class: "tres-petit", style: { color: "var(--cuivre-clair)", marginTop: "2px" } }, `Équipé · ${portes.map((e) => libelle("emplacement", e)).join(", ")}`) : null));
    }
  };

  const select = (cle, defaut, options, lib) =>
    h(
      "select",
      {
        class: "filtre",
        "aria-label": defaut,
        onchange: (e) => {
          filtres[cle] = e.target.value;
          remplir();
        },
      },
      h("option", { value: "" }, defaut),
      options.map((v) => h("option", { value: v, selected: filtres[cle] === v }, lib(v))),
    );

  remplir();
  return h(
    "div",
    null,
    h("div", { class: "filtres" }, select("type", "Tous les types", types, (t) => libelle("type_objet", t)), select("qualite", "Toutes qualités", qualites, (q) => libelle("qualite", q))),
    liste,
  );
}

function ecranMateriaux(d) {
  const mats = d.inventaire?.materiaux ?? [];
  if (!mats.length) return vide("Aucun matériau en réserve.", "⛏️");
  const ordre = ["S", "A", "B", "C", "D", "E", "F"];
  const tries = [...mats].sort((a, b) => ordre.indexOf(a.rang) - ordre.indexOf(b.rang) || a.nom.localeCompare(b.nom, "fr"));
  return carte(
    h(
      "ul",
      { class: "liste" },
      tries.map((m) =>
        h(
          "li",
          null,
          h(
            "div",
            { class: "ligne" },
            h("div", null, h("strong", null, m.nom), m.proprietes?.length ? h("p", { class: "tres-petit discret" }, m.proprietes.join(", ")) : null),
            h("div", { class: "droite" }, h("span", { class: "puce" }, `Rang ${m.rang}`), h("span", { class: "mono", style: { display: "inline-block", minWidth: "3ch", marginLeft: "8px" } }, `×${m.quantite}`)),
          ),
        ),
      ),
    ),
  );
}

function ecranForge(d, base, refs) {
  const f = d.forge;
  if (!f) return vide("La forge est froide : aucune donnée.", "🔥");
  const stock = new Map((d.inventaire?.materiaux ?? []).map((m) => [m.id, m.quantite]));
  const niveau = d.perso?.metiers?.forge ?? 0;
  const qualiteMax = [...(f.premieres_qualites ?? [])].sort((a, b) => ORDRE_QUALITES.indexOf(b) - ORDRE_QUALITES.indexOf(a))[0];

  const recettes = (f.recettes ?? []).map((r) => {
    const possible = (r.materiaux ?? []).every((m) => (stock.get(m.id) ?? 0) >= m.quantite);
    return h(
      "li",
      null,
      h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, r.nom), possible ? puce("faisable", "ok") : puce("manque", "danger")),
      h(
        "ul",
        { class: "etapes", style: { marginTop: "4px" } },
        (r.materiaux ?? []).map((m) => {
          const a = stock.get(m.id) ?? 0;
          return h("li", { class: a >= m.quantite ? "faite" : "" }, `${m.nom} ×${m.quantite}`, h("span", { class: "tres-discret mono" }, ` (${a})`));
        }),
      ),
      h("p", { class: "tres-petit tres-discret", style: { marginTop: "2px" } }, [libelle("type_objet", r.type), r.heures ? `${r.heures} h` : null, libelle("source_recette", r.source), r.jour ? `jour ${r.jour}` : null].filter(Boolean).join(" · ")),
    );
  });

  const historique = [...(f.historique ?? [])].reverse().map((c) =>
    h(
      "li",
      { dataset: { qualite: c.qualite } },
      h(
        "div",
        { class: "ligne", style: { minHeight: "auto" } },
        h("div", null, c.objet ? refs.lien(c.objet, c.nom ?? "Objet") : h("span", null, c.nom ?? (c.experimental ? "Essai expérimental" : "Création")), c.experimental ? h("span", { class: "tres-petit discret" }, " · expérimental") : null),
        h("span", { class: "badge-qualite droite" }, libelle("qualite", c.qualite)),
      ),
      h("p", { class: "tres-petit discret mono", style: { marginTop: "2px" } }, `d20=${c.d20} → ${c.total}`, c.xp_maitrise ? ` · +${c.xp_maitrise} xp` : "", c.jour ? ` · jour ${c.jour}` : ""),
    ),
  );

  const vitrine = [
    ...(d.inventaire?.objets ?? []).filter((o) => o.qualite === "Unique" || o.qualite === "Legendaire"),
  ];
  for (const e of d.objets?.entrees ?? []) {
    if ((e.qualite === "Unique" || e.qualite === "Legendaire") && !vitrine.some((o) => o.id === e.id)) vitrine.push(e);
  }

  return h(
    "div",
    null,
    fenetre(
      "Maîtrise de forge",
      null,
      h(
        "div",
        { class: "grille-3" },
        h("div", { class: "case" }, h("span", { class: "etiquette" }, "Niveau"), h("span", { class: "chiffre" }, niveau)),
        h("div", { class: "case" }, h("span", { class: "etiquette" }, "XP maîtrise"), h("span", { class: "chiffre" }, f.maitrise_xp)),
        h("div", { class: "case" }, h("span", { class: "etiquette" }, "Meilleure"), h("span", { class: "chiffre", dataset: { qualite: qualiteMax }, style: { color: "var(--q)", fontSize: "1rem", paddingTop: "4px" } }, libelle("qualite", qualiteMax) || "—")),
      ),
      f.enclume ? h("p", { class: "petit", style: { marginTop: "10px" } }, `⚒️ ${f.enclume.nom}`, h("span", { class: "discret" }, ` · +${f.enclume.bonus} au jet`)) : null,
    ),
    vitrine.length
      ? h(
          "div",
          null,
          sectionTitre("Galerie", "Unique et Légendaire"),
          vitrine.map((o) =>
            h(
              "a",
              { class: "carte objet vitrine", href: refs.trouver(o.id)?.href ?? "#", dataset: { qualite: o.qualite } },
              h("div", { class: "carte-tete" }, h("div", { class: "nom" }, o.nom), h("span", { class: "badge-qualite" }, libelle("qualite", o.qualite))),
              o.histoire ? h("p", { class: "recit petit", style: { marginTop: "6px" } }, o.histoire) : null,
            ),
          ),
        )
      : null,
    sectionTitre("Recettes connues", pluriel(recettes.length, "recette")),
    carte(h("ul", { class: "liste" }, recettes)),
    sectionTitre("Historique des créations"),
    historique.length ? carte(h("ul", { class: "liste" }, historique)) : vide("Rien n'est encore sorti de ta forge.", "🔥"),
  );
}

function ficheObjet(d, id, refs) {
  const o = objetsParId(d).get(id) ?? (d.objets?.entrees ?? []).find((e) => e.id === id);
  if (!o) return { titre: "Objet", contenu: vide("Cet objet n'est pas (ou plus) dans ton sac.", "🎒") };
  const codex = (d.objets?.entrees ?? []).find((e) => e.id === id);
  const histoire = codex?.histoire ?? o.histoire;
  const portes = emplacementsPortes(d, o.id);
  const createur = o.forge_par ?? codex?.createur;
  const nomCreateur = createur === "heros" ? `${d.perso?.nom ?? "Toi"} (toi)` : createur ? refs.nom(createur, "Inconnu") : "Inconnu";

  const stats = definitions([
    ["Dégâts", o.degats ? `${o.degats}${o.stat_attaque ? ` (${o.stat_attaque})` : ""}` : null],
    ["Défense", o.defense !== undefined ? `+${o.defense}` : null],
    ["Bonus", o.bonus ? texteBonus(o.bonus) : null],
    ["Quantité", o.quantite > 1 ? String(o.quantite) : null],
    ["Poids", o.poids_kg !== undefined ? `${o.poids_kg} kg` : null],
    ["Valeur", o.valeur !== undefined ? `${o.valeur} or` : null],
    ["Créé par", o.forge_par !== undefined || codex ? nomCreateur : null],
    ["Créé le", o.cree_jour ? `jour ${o.cree_jour}` : null],
    ["Matériaux", (o.materiaux ?? []).map((m) => refs.nom(m)).filter(Boolean).join(", ")],
    ["Équipé", portes.map((e) => libelle("emplacement", e)).join(", ")],
  ]);

  const affixes = o.affixes?.length
    ? fenetre(
        "Affixes",
        String(o.affixes.length),
        h(
          "ul",
          { class: "liste serree" },
          o.affixes.map((a) => h("li", null, h("strong", null, a.nom), h("p", { class: "petit discret" }, a.effet))),
        ),
      )
    : null;

  const dura = o.durabilite
    ? fenetre("Durabilité", `${o.durabilite.actuelle}/${o.durabilite.max}`, barre(o.durabilite.actuelle, o.durabilite.max, o.durabilite.actuelle / o.durabilite.max < 0.3 ? "pv" : "sys"))
    : null;

  const lignee = o.lignee
    ? fenetre(
        "Lignée",
        o.lignee.palier ? `Éveil ${chiffresRomains(o.lignee.palier)}` : "Endormie",
        h("p", { class: "chiffre petit" }, `${o.lignee.xp} xp de lignée`),
        o.lignee.capacites?.length ? h("ul", { class: "liste serree", style: { marginTop: "6px" } }, o.lignee.capacites.map((c) => h("li", { class: "petit" }, c))) : null,
      )
    : null;

  const contenu = h(
    "div",
    null,
    h(
      "div",
      { class: "carte objet", dataset: { qualite: o.qualite } },
      h("div", { class: "carte-tete" }, h("h1", { class: "qualite-texte", style: { fontSize: "1.75rem" } }, o.nom), h("span", { class: "badge-qualite" }, libelle("qualite", o.qualite))),
      h("p", { class: "meta" }, [libelle("type_objet", o.type), o.sous_type].filter(Boolean).join(" · ")),
      codex?.description || o.description ? h("p", { class: "recit", style: { marginTop: "10px" } }, codex?.description ?? o.description) : null,
    ),
    stats ? carte(stats) : null,
    affixes,
    dura,
    lignee,
    histoire && (o.qualite === "Unique" || o.qualite === "Legendaire" || !o.qualite)
      ? h("div", null, sectionTitre("Histoire"), carte(h("p", { class: "citation" }, histoire)))
      : null,
  );
  return { titre: o.nom, contenu };
}

export function rendre({ d, refs, reste }) {
  const base = refs.base;
  const sous = reste[0] || "equipement";
  if (sous === "objet") {
    const { titre, contenu } = ficheObjet(d, reste[1], refs);
    return { titre, retour: `${base}/sac/inventaire`, contenu };
  }

  const vues = {
    equipement: () => ecranEquipement(d, base),
    inventaire: () => ecranInventaire(d, base),
    materiaux: () => ecranMateriaux(d),
    forge: () => ecranForge(d, base, refs),
  };
  const contenu = h(
    "div",
    null,
    h(
      "div",
      { class: "ligne", style: { marginBottom: "8px" } },
      h("h1", { style: { fontSize: "1.75rem" } }, sous === "forge" ? "Forge" : "Sac"),
      h("span", { class: "mono droite", style: { color: "var(--q-unique)" }, "aria-label": `${d.inventaire?.or ?? 0} pièces d'or` }, `◉ ${d.inventaire?.or ?? 0} or`),
    ),
    segments(
      [
        ["equipement", "Équipé", `${base}/sac/equipement`],
        ["inventaire", "Objets", `${base}/sac/inventaire`],
        ["materiaux", "Matériaux", `${base}/sac/materiaux`],
        ["forge", "Forge", `${base}/sac/forge`],
      ],
      sous,
    ),
    (vues[sous] ?? vues.equipement)(),
  );
  return { titre: d.partie?.nom ?? "Sac", retour: "#/", contenu };
}
