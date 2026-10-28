// Héros — fenêtre de statut.
import { h, fenetre, carte, barre, sectionTitre, repli, puce, definitions } from "./dom.js";
import { libelle, texteBonus, pluriel } from "./libelles.js";
import { STATS, derivees, modificateur, seuilUsage, signe } from "../regles.js";

const NOMS_STATS = { FOR: "Force", AGI: "Agilité", END: "Endurance", INT: "Intelligence", DEX: "Dextérité", VOL: "Volonté", CHA: "Charisme" };

function entete(d, der, refs) {
  const p = d.perso;
  const classe = p.classe;
  const actifs = new Set(p.titres?.actifs ?? []);
  const titres = (p.titres?.obtenus ?? []).filter((t) => actifs.has(t.id));
  const pointsLibres = [];
  if (p.points_stat) pointsLibres.push(h("span", null, `${pluriel(p.points_stat, "point")} de stat à attribuer`));
  if (p.points_competence) pointsLibres.push(h("span", null, `${pluriel(p.points_competence, "point")} de compétence`));

  return fenetre(
    "Statut",
    d.partie?.calendrier ? `Jour ${d.partie.calendrier.jour}` : null,
    h(
      "div",
      { class: "heros-tete" },
      h(
        "div",
        null,
        h("h1", null, p.nom),
        h("p", { class: "discret petit" }, [libelle("origine", p.origine), refs.nom(d.partie?.lieu_actuel)].filter(Boolean).join(" · ")),
      ),
      h("div", null, h("div", { class: "rang", "aria-label": `Rang ${d.systeme?.rang ?? "?"}` }, d.systeme?.rang ?? "—"), h("div", { class: "rang-legende" }, "Rang")),
    ),
    h(
      "div",
      { class: "grille-2", style: { marginTop: "12px" } },
      h("div", { class: "case" }, h("span", { class: "etiquette" }, "Niveau"), h("span", { class: "chiffre" }, p.niveau)),
      classe
        ? h(
            "div",
            { class: "case" },
            h("span", { class: "etiquette" }, `Classe · ${libelle("rang_classe", classe.rang)}`),
            h("span", { style: { display: "block", fontWeight: 600 } }, classe.nom, classe.eveil ? ` · Éveil ${classe.eveil}` : ""),
          )
        : null,
    ),
    h(
      "div",
      { class: "jauge-ligne", style: { marginTop: "12px" } },
      h("span", { class: "petit discret" }, "Expérience"),
      h("span", { class: "chiffre petit" }, `${p.xp} / ${der.seuilXp}`),
      barre(p.xp, der.seuilXp, "sys"),
    ),
    titres.length ? h("div", { class: "puces", style: { marginTop: "12px" } }, titres.map((t) => puce(`« ${t.nom} »`))) : null,
    pointsLibres.length ? h("div", { class: "points-libres" }, pointsLibres) : null,
  );
}

function ressources(p, der) {
  const r = p.ressources ?? {};
  const ligne = (etiquette, valeur, max, variante) =>
    h("div", { class: "ressource" }, h("span", { class: "etiquette" }, etiquette), barre(valeur ?? 0, max, variante), h("span", { class: "valeur" }, `${valeur ?? 0}/${max}`));
  return fenetre("Ressources", null, ligne("PV", r.pv, der.pvMax, "pv"), ligne("PM", r.pm, der.pmMax, "pm"), ligne("⚡", r.end, der.enduranceMax, "endu"));
}

function tableauStats(p, der) {
  const corps = STATS.map((s) => {
    const base = p.stats?.[s] ?? 0;
    const bonus = der.bonus[s];
    const effectif = base + bonus;
    const usage = p.usage?.[s] ?? 0;
    const seuil = seuilUsage(base);
    return h(
      "tr",
      null,
      h("td", { class: "nom-stat", title: NOMS_STATS[s] }, s),
      h("td", { class: "num" }, base, bonus ? h("span", { class: "bonus", title: "Bonus (classe, titres, équipement)" }, signe(bonus)) : null),
      h("td", { class: "num" }, signe(modificateur(effectif))),
      h("td", { class: "usage" }, barre(usage, seuil, "sys fine"), h("span", { class: "tres-petit" }, `${usage}/${seuil} vers +1`)),
    );
  });
  return fenetre(
    "Stats",
    null,
    h(
      "table",
      { class: "stats" },
      h("thead", null, h("tr", null, h("th", null, "Stat"), h("th", { class: "num" }, "Val."), h("th", { class: "num" }, "Mod"), h("th", null, "Usage"))),
      h("tbody", null, corps),
    ),
  );
}

function statsCachees(p) {
  const cachees = Object.values(p.stats_cachees ?? {});
  if (!cachees.length) return null;
  return fenetre(
    "Stats cachées",
    "débloquées",
    h(
      "ul",
      { class: "liste serree" },
      cachees.map((c) =>
        h(
          "li",
          null,
          h("div", { class: "ligne" }, h("strong", null, c.nom), h("span", { class: "chiffre droite", style: { fontSize: "1.25rem" } }, c.valeur)),
          c.description ? h("p", { class: "petit discret" }, c.description) : null,
        ),
      ),
    ),
  );
}

function tuilesDerivees(der) {
  const tuile = (etiquette, valeur, note) =>
    h("div", { class: "case" }, h("span", { class: "etiquette" }, etiquette), h("span", { class: "chiffre" }, valeur), note ? h("span", { class: "tres-petit discret" }, note) : null);
  return fenetre(
    "Dérivées",
    null,
    h(
      "div",
      { class: "grille-3" },
      tuile("Défense", der.defense, der.armure ? `armure ${der.armure}` : null),
      tuile("Initiative", signe(der.initiative)),
      tuile("Charge", `${Math.round(der.poids * 10) / 10}`, `/ ${der.chargeMax} kg`),
      tuile("PV max", der.pvMax),
      tuile("PM max", der.pmMax),
      tuile("⚡ max", der.enduranceMax),
    ),
  );
}

function metiers(p) {
  const m = Object.entries(p.metiers ?? {});
  if (!m.length) return null;
  return carte(
    h("h3", { style: { marginBottom: "4px" } }, "Métiers"),
    h(
      "ul",
      { class: "liste serree" },
      m.map(([cle, niveau]) => h("li", null, h("div", { class: "ligne" }, h("span", null, libelle("metier", cle)), h("span", { class: "mono droite" }, `niv. ${niveau}`)))),
    ),
  );
}

function coutTexte(cout) {
  if (!cout) return "";
  return Object.entries(cout)
    .map(([k, v]) => `${v} ${libelle("ressource", k)}`)
    .join(" + ");
}

function competences(p) {
  const liste = p.competences ?? [];
  if (!liste.length) return null;
  return h(
    "div",
    null,
    sectionTitre("Compétences", pluriel(liste.length, "compétence")),
    carte(
      liste.map((c) =>
        repli(
          h(
            "span",
            { style: { display: "flex", flexDirection: "column", minWidth: 0 } },
            h("strong", null, c.nom),
            h("span", { class: "tres-petit discret" }, [libelle("type_competence", c.type), `niv. ${c.niveau}`, c.stat, coutTexte(c.cout)].filter(Boolean).join(" · ")),
          ),
          h(
            "div",
            { class: "pile-s" },
            c.description ? h("p", { class: "recit" }, c.description) : null,
            definitions([
              ["Coût", coutTexte(c.cout)],
              ["Recharge", c.recharge ? pluriel(c.recharge, "tour") : null],
              ["XP", c.xp !== undefined ? String(c.xp) : null],
              ["Source", c.source],
            ]),
          ),
        ),
      ),
    ),
  );
}

function titres(p) {
  const obtenus = p.titres?.obtenus ?? [];
  if (!obtenus.length) return null;
  const actifs = new Set(p.titres?.actifs ?? []);
  return h(
    "div",
    null,
    sectionTitre("Titres", `${actifs.size} actif${actifs.size > 1 ? "s" : ""}`),
    carte(
      h(
        "ul",
        { class: "liste" },
        obtenus.map((t) =>
          h(
            "li",
            null,
            h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, t.nom), actifs.has(t.id) ? puce("actif", "cuivre") : null),
            t.description ? h("p", { class: "petit discret recit" }, t.description) : null,
            h("p", { class: "tres-petit tres-discret" }, [t.bonus ? texteBonus(t.bonus) : null, t.jour ? `jour ${t.jour}` : null].filter(Boolean).join(" · ")),
          ),
        ),
      ),
    ),
  );
}

function malus(p, jour) {
  const actifs = (p.malus ?? []).filter((m) => m.jusqua_jour === undefined || jour === undefined || m.jusqua_jour >= jour);
  if (!actifs.length) return null;
  return h(
    "div",
    null,
    sectionTitre("Malus actifs"),
    carte(
      h(
        "ul",
        { class: "liste serree" },
        actifs.map((m) =>
          h(
            "li",
            null,
            h("strong", null, "⚠️ ", m.nom),
            h("p", { class: "petit discret" }, [m.jets ? `${signe(m.jets)} aux jets` : null, m.jusqua_jour ? `jusqu'au jour ${m.jusqua_jour}` : null].filter(Boolean).join(" · ")),
          ),
        ),
      ),
    ),
  );
}

export function rendre({ d, refs }) {
  const der = derivees(d.perso, d.inventaire);
  const jour = d.partie?.calendrier?.jour;
  const contenu = h(
    "div",
    null,
    entete(d, der, refs),
    ressources(d.perso, der),
    malus(d.perso, jour),
    tableauStats(d.perso, der),
    statsCachees(d.perso),
    tuilesDerivees(der),
    h("div", { style: { marginTop: "12px" } }, metiers(d.perso)),
    competences(d.perso),
    titres(d.perso),
  );
  return { titre: d.partie?.nom ?? "Héros", retour: "#/", contenu };
}
