// Jets — historique des dés (dernier en premier) et petites stats.
import { h, fenetre, vide } from "./dom.js";
import { libelle, ICONES_DEGRE } from "./libelles.js";
import { bilanJets, signe } from "../regles.js";

const ICONES_TYPE = { degats: "🗡️", initiative: "⏱️", forge: "⚒️", enchantement: "✨" };

function ligneJet(j) {
  const icone = j.degre ? ICONES_DEGRE[j.degre] ?? "🎲" : ICONES_TYPE[j.type] ?? "🎲";
  let resultat;
  if (j.dd !== undefined) resultat = `${j.total} vs DD ${j.dd}`;
  else if (j.qualite) resultat = `${j.total} → ${libelle("qualite", j.qualite)}`;
  else resultat = String(j.total ?? "");

  const morceaux = [];
  if (j.des?.length) morceaux.push(j.des.length > 1 ? `d20=${j.des.join("/")}→${j.garde}` : `d20=${j.des[0]}`);
  if (j.stat && j.mod !== undefined) morceaux.push(`${signe(j.mod)} ${j.stat}`);
  if (j.competence) morceaux.push(`+${j.competence.niveau} ${j.competence.nom}`);
  for (const b of j.bonus ?? []) morceaux.push(`${signe(b.valeur)} ${b.source}`);
  if (j.avantage && j.avantage !== "aucun") morceaux.push(`(${libelle("avantage", j.avantage)})`);

  return h(
    "li",
    { class: "jet" },
    h("span", { class: "icone", "aria-hidden": "true" }, icone),
    h(
      "div",
      null,
      h("p", { class: "raison" }, j.raison ?? libelle("type_jet", j.type)),
      h("p", { class: "tres-petit discret" }, [libelle("type_jet", j.type), j.degre ? libelle("degre", j.degre) : null, j.session ? `session ${j.session}` : null, j.jour ? `jour ${j.jour}` : null].filter(Boolean).join(" · ")),
    ),
    h("span", { class: "total", dataset: j.qualite ? { qualite: j.qualite } : null, style: j.qualite ? { color: "var(--q)" } : null }, resultat),
    morceaux.length ? h("p", { class: "detail" }, morceaux.join(" ")) : null,
  );
}

export function rendre({ d, refs }) {
  const jets = [...(d.des ?? [])].sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
  const retour = `${refs.base}/plus`;
  if (!jets.length) return { titre: "Jets", retour, contenu: vide("Aucun dé n'a encore roulé.", "🎲") };
  const b = bilanJets(jets);
  const tuile = (et, v) => h("div", { class: "case" }, h("span", { class: "etiquette" }, et), h("span", { class: "chiffre" }, v));
  const contenu = h(
    "div",
    null,
    fenetre("Bilan des dés", `${b.total} jets`, h("div", { class: "grille-3" }, tuile("Réussite", b.taux === null ? "—" : `${b.taux} %`), tuile("💥 Critiques", b.critiques), tuile("💀 Fiascos", b.fiascos))),
    fenetre("Historique", "dernier en premier", h("ul", { class: "liste" }, jets.map(ligneJet))),
  );
  return { titre: "Jets", retour, contenu };
}
