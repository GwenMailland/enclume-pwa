// Système — rang, quotidiennes, quêtes du Système, brèches, pénalités.
import { h, fenetre, barre, vide, puce, definitions, sectionTitre } from "./dom.js";
import { libelle, pluriel } from "./libelles.js";

function decompte(jusqua, jour, texte = "dans") {
  if (jusqua === undefined || jour === undefined) return null;
  const reste = jusqua - jour;
  if (reste < 0) return h("span", { class: "decompte tres-discret" }, `jour ${jusqua} (passé)`);
  return h("span", { class: `decompte ${reste <= 3 ? "urgent" : ""}`.trim() }, reste === 0 ? "aujourd'hui" : `${texte} ${pluriel(reste, "jour")}`);
}

function quotidiennes(s, jour) {
  const q = s.quotidiennes;
  if (!q) return null;
  const varianteStatut = q.statut === "accomplie" ? "ok" : q.statut === "echouee" ? "danger" : "";
  return fenetre(
    `Quête quotidienne — Jour ${q.jour ?? jour}`,
    null,
    h(
      "ul",
      { class: "liste serree" },
      (q.taches ?? []).map((t) =>
        h(
          "li",
          null,
          h("div", { class: "ligne", style: { minHeight: "auto" } }, h("span", null, t.progression >= t.objectif ? "✓ " : "· ", t.texte), h("span", { class: "chiffre petit droite" }, `[${t.progression}/${t.objectif}]`, t.unite ? h("span", { class: "discret" }, ` ${t.unite}`) : null)),
          h("div", { style: { marginTop: "4px" } }, barre(t.progression, t.objectif, t.progression >= t.objectif ? "ok fine" : "sys fine")),
        ),
      ),
    ),
    h(
      "div",
      { style: { marginTop: "10px" } },
      definitions([
        ["Récompense", q.recompense],
        ["Échec", q.penalite],
      ]),
    ),
    h("div", { class: "puces", style: { marginTop: "10px" } }, puce(libelle("statut_quotidienne", q.statut), varianteStatut), s.bilan_quotidiennes ? puce(`Série : ${s.bilan_quotidiennes.serie}`) : null),
  );
}

function bilan(s) {
  const b = s.bilan_quotidiennes;
  if (!b) return null;
  const tuile = (et, v) => h("div", { class: "case" }, h("span", { class: "etiquette" }, et), h("span", { class: "chiffre" }, v));
  return fenetre("Bilan des quotidiennes", null, h("div", { class: "grille-3" }, tuile("Accomplies", b.accomplies), tuile("Échouées", b.echouees), tuile("Série", b.serie)));
}

function quetesSysteme(s, jour) {
  const qs = s.quetes ?? [];
  if (!qs.length) return null;
  const ordre = { active: 0, echouee: 1, terminee: 2 };
  return fenetre(
    "Quêtes du Système",
    String(qs.length),
    h(
      "ul",
      { class: "liste" },
      [...qs]
        .sort((a, b) => (ordre[a.statut] ?? 3) - (ordre[b.statut] ?? 3))
        .map((q) =>
          h(
            "li",
            { style: { opacity: q.statut === "terminee" ? 0.65 : 1 } },
            h(
              "div",
              { class: "ligne", style: { minHeight: "auto" } },
              h("strong", null, q.titre),
              h("span", { class: "droite" }, puce(q.statut === "active" ? libelle("type_quete_sys", q.type) : libelle("statut_quete", q.statut), q.type === "urgente" && q.statut === "active" ? "danger" : q.statut === "terminee" ? "ok" : "")),
            ),
            q.description ? h("p", { class: "petit", style: { marginTop: "4px" } }, q.description) : null,
            h(
              "div",
              { style: { marginTop: "6px" } },
              definitions([
                ["Échéance", q.echeance_jour && q.statut === "active" ? h("span", null, `jour ${q.echeance_jour} · `, decompte(q.echeance_jour, jour)) : null],
                ["Récompense", q.recompense],
                ["Échec", q.echec],
              ]),
            ),
          ),
        ),
    ),
  );
}

function breches(s, jour, refs) {
  const bs = s.breches ?? [];
  if (!bs.length) return null;
  const ordre = { ouverte: 0, en_cours: 0, debordee: 1, fermee: 2 };
  return h(
    "div",
    null,
    sectionTitre("Brèches connues", String(bs.length)),
    [...bs]
      .sort((a, b) => (ordre[a.etat] ?? 3) - (ordre[b.etat] ?? 3))
      .map((b) => {
        const active = b.etat === "ouverte" || b.etat === "en_cours";
        return fenetre(
          `Brèche · rang ${b.rang}`,
          libelle("etat_breche", b.etat),
          h("h3", null, b.nom),
          h("p", { class: "petit discret" }, [refs.nom(b.region), refs.nom(b.lieu)].filter(Boolean).join(" · ")),
          active && b.debordement_jour !== undefined
            ? h("p", { style: { marginTop: "8px", fontSize: "1.0625rem" } }, "Débordement ", decompte(b.debordement_jour, jour), h("span", { class: "discret petit" }, ` · jour ${b.debordement_jour}`))
            : null,
          b.etages
            ? h(
                "div",
                { class: "jauge-ligne", style: { marginTop: "8px" } },
                h("span", { class: "petit discret" }, "Étages"),
                h("span", { class: "chiffre petit" }, `${b.etage_atteint ?? 0}/${b.etages}`),
                barre(b.etage_atteint ?? 0, b.etages, b.etat === "fermee" ? "ok" : "sys"),
              )
            : null,
          h("p", { class: "tres-petit discret", style: { marginTop: "8px" } }, [b.apparue_jour ? `apparue jour ${b.apparue_jour}` : null, b.fermee_jour ? `fermée jour ${b.fermee_jour}` : null].filter(Boolean).join(" · ")),
        );
      }),
  );
}

function penalites(s) {
  const ps = s.penalites ?? [];
  if (!ps.length) return null;
  return fenetre(
    "Épreuves de pénalité",
    String(ps.length),
    h(
      "ul",
      { class: "liste serree" },
      [...ps].reverse().map((p) => h("li", null, h("div", { class: "ligne", style: { minHeight: "auto" } }, h("span", { class: "petit" }, p.raison), h("span", { class: "droite tres-petit discret" }, `jour ${p.jour} · ${libelle("statut_penalite", p.statut)}`)))),
    ),
  );
}

export function rendre({ d, refs }) {
  const s = d.systeme;
  const jour = d.partie?.calendrier?.jour;
  if (!s) return { titre: "Système", retour: `${refs.base}/plus`, contenu: vide("Le Système reste silencieux.", "⟐") };
  const contenu = h(
    "div",
    { class: "pile-s" },
    fenetre(
      "Système",
      d.perso?.nom,
      h("div", { class: "ligne" }, h("div", null, h("p", { class: "discret petit" }, "Rang actuel du candidat"), h("p", { class: "petit" }, `Jour ${jour ?? "?"}`)), h("div", { class: "rang", style: { width: "64px", height: "64px", fontSize: "2.25rem" } }, s.rang ?? "—")),
    ),
    quotidiennes(s, jour),
    bilan(s),
    quetesSysteme(s, jour),
    breches(s, jour, refs),
    penalites(s),
  );
  return { titre: "Système", retour: `${refs.base}/plus`, contenu };
}
