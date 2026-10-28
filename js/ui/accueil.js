// Accueil — Mes parties.
import { h, vide } from "./dom.js";
import { dateJeu, heureLocale } from "./libelles.js";
import { derniereSynchro, modeDemo } from "../donnees.js";

function cartePartie(p) {
  const enCours = p.statut !== "terminee";
  const synchro = derniereSynchro(p.id);
  return h(
    "a",
    { class: "carte", href: `#/p/${encodeURIComponent(p.id)}/heros` },
    h(
      "div",
      { class: "carte-tete" },
      h(
        "div",
        null,
        h("h3", null, p.nom),
        h("p", { class: "meta" }, [p.heros, p.niveau ? `niveau ${p.niveau}` : null, p.classe].filter(Boolean).join(" · ")),
      ),
      h("span", { class: `puce ${enCours ? "cuivre" : ""}`, title: enCours ? "En cours" : "Terminée" }, enCours ? "⚔️ En cours" : "🕯️ Terminée"),
    ),
    h(
      "p",
      { class: "petit", style: { marginTop: "8px" } },
      [p.lieu ? `📍 ${p.lieu}` : null, p.date ? dateJeu(p.date) : null].filter(Boolean).join("  ·  "),
    ),
    h(
      "p",
      { class: "tres-petit tres-discret", style: { marginTop: "4px" } },
      [p.session ? `Session ${p.session}` : null, synchro ? `synchro ${heureLocale(synchro)}` : "jamais synchronisée"].filter(Boolean).join(" · "),
    ),
  );
}

export function rendre({ index }) {
  const parties = [...index.parties].sort((a, b) => {
    if ((a.statut === "terminee") !== (b.statut === "terminee")) return a.statut === "terminee" ? 1 : -1;
    return String(b.maj_le ?? "").localeCompare(String(a.maj_le ?? ""));
  });

  const contenu = h(
    "div",
    null,
    h(
      "div",
      { style: { textAlign: "center", margin: "8px 0 20px" } },
      h("h1", null, "Mes parties"),
      h("p", { class: "discret recit", style: { fontStyle: "italic" } }, "Ce que l'enclume a retenu de tes chroniques."),
    ),
    parties.length
      ? parties.map(cartePartie)
      : vide(modeDemo() ? "Aucune partie dans la démo." : "Aucune partie pour l'instant. Lance /nouvelle-partie dans Claude Code.", "📜"),
    h(
      "a",
      { class: "carte", href: "#/reglages", style: { marginTop: "24px" } },
      h(
        "div",
        { class: "ligne" },
        h("div", null, h("strong", null, "⚙️ Réglages"), h("p", { class: "meta" }, modeDemo() ? "Mode démo — connecte ton repo GitHub" : "Connexion GitHub, cache, version")),
        h("span", { class: "chevron", "aria-hidden": "true" }, "›"),
      ),
    ),
  );
  return { titre: "Chroniques de l'Enclume", contenu };
}
