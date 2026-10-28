// Plus — accès à Système, Ville, Destinée, Jets, Réglages.
import { h, carte } from "./dom.js";
import { libelle, pluriel } from "./libelles.js";

export function rendre({ d, refs }) {
  const base = refs.base;
  const ville = d.ville?.debloquee ? `${d.ville.nom} · ${libelle("palier_ville", d.ville.palier)}` : "Pas encore de terre à ton nom";
  const ouvertes = (d.systeme?.breches ?? []).filter((b) => b.etat === "ouverte" || b.etat === "en_cours").length;
  const entrees = [
    ["systeme", "⟐", "Système", [`Rang ${d.systeme?.rang ?? "?"}`, ouvertes ? `${pluriel(ouvertes, "brèche ouverte", "brèches ouvertes")}` : null].filter(Boolean).join(" · ")],
    ["ville", "🏰", "Ville", ville],
    ["destinee", "✶", "Destinée", pluriel((d.destinee?.choix ?? []).length, "choix irréversible", "choix irréversibles")],
    ["jets", "🎲", "Jets", pluriel((d.des ?? []).length, "jet")],
    ["reglages", "⚙️", "Réglages", "Connexion GitHub, cache, version"],
  ];
  const contenu = h(
    "div",
    null,
    h("h1", { style: { fontSize: "1.75rem", marginBottom: "10px" } }, "Plus"),
    carte(
      h(
        "ul",
        { class: "liste menu-plus" },
        entrees.map(([cle, icone, titre, detail]) =>
          h(
            "li",
            { style: { padding: 0 } },
            h("a", { href: `${base}/${cle}` }, h("span", { class: "icone", "aria-hidden": "true" }, icone), h("span", { class: "libelle" }, titre, h("small", null, detail)), h("span", { class: "chevron", "aria-hidden": "true" }, "›")),
          ),
        ),
      ),
    ),
    h("p", { class: "tres-petit tres-discret", style: { textAlign: "center", marginTop: "16px" } }, d.partie ? `${libelle("mode_mort", d.partie.mode_mort)} · ${pluriel(d.partie.morts ?? 0, "mort")}` : ""),
  );
  return { titre: d.partie?.nom ?? "Plus", retour: "#/", contenu };
}
