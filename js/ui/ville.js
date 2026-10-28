// Ville — masquée tant qu'elle n'est pas débloquée.
import { h, carte, barre, vide, sectionTitre, definitions, puce } from "./dom.js";
import { libelle, pluriel } from "./libelles.js";

function jauge(etiquette, valeur, max = 100, variante = "") {
  return h(
    "div",
    { class: "jauge-ligne", style: { marginTop: "10px" } },
    h("span", { class: "petit" }, etiquette),
    h("span", { class: "mono petit" }, max === 100 ? `${valeur}/100` : String(valeur)),
    barre(valeur, max, variante),
  );
}

export function rendre({ d, refs }) {
  const v = d.ville;
  const retour = `${refs.base}/plus`;
  if (!v || !v.debloquee) {
    return { titre: "Ville", retour, contenu: vide("Aucune terre à ton nom… pour l'instant.", "🏰") };
  }
  const j = v.jauges ?? {};
  const ressources = Object.entries(v.ressources ?? {}).filter(([k]) => !v.ressources_actives || v.ressources_actives.includes(k));

  const contenu = h(
    "div",
    null,
    carte(
      h("div", { class: "carte-tete" }, h("div", null, h("h1", { style: { fontSize: "1.875rem" } }, v.nom), h("p", { class: "meta" }, [refs.nom(v.lieu) !== v.nom ? refs.nom(v.lieu) : null, v.fondee_jour ? `fondée le jour ${v.fondee_jour}` : null].filter(Boolean).join(" · "))), puce(libelle("palier_ville", v.palier), "cuivre")),
      j.population !== undefined ? h("p", { class: "petit", style: { marginTop: "8px" } }, `👥 ${pluriel(j.population, "habitant")}`) : null,
      j.moral !== undefined ? jauge("Moral", j.moral, 100, j.moral < 30 ? "pv" : "ok") : null,
      j.defense !== undefined ? jauge("Défense", j.defense) : null,
      j.renommee !== undefined ? jauge("Renommée", j.renommee) : null,
      v.menace_raid !== undefined ? jauge("Menace de raid", v.menace_raid, 100, "pv") : null,
    ),
    ressources.length
      ? h(
          "div",
          null,
          sectionTitre("Ressources"),
          carte(
            h(
              "table",
              { class: "stats", style: { fontFamily: "var(--f-ui)" } },
              h("tbody", null, ressources.map(([k, n]) => h("tr", null, h("td", { style: { borderTopColor: "var(--trait)" } }, libelle("ressource_ville", k)), h("td", { class: "num mono", style: { borderTopColor: "var(--trait)", paddingRight: 0 } }, n)))),
            ),
          ),
        )
      : null,
    sectionTitre("Bâtiments", String((v.batiments ?? []).length)),
    (v.batiments ?? []).length
      ? carte(
          h(
            "ul",
            { class: "liste" },
            v.batiments.map((b) => h("li", null, h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, b.nom), h("span", { class: "puce droite" }, `niv. ${b.niveau}`)), b.effet ? h("p", { class: "petit discret" }, b.effet) : null)),
          ),
        )
      : vide("Aucun bâtiment.", "🧱"),
    (v.chantiers ?? []).length
      ? h(
          "div",
          null,
          sectionTitre("Chantiers"),
          carte(
            h(
              "ul",
              { class: "liste" },
              v.chantiers.map((c) =>
                h(
                  "li",
                  null,
                  h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, "🔨 ", c.nom), h("span", { class: "mono droite petit" }, c.jours_restants ? `${pluriel(c.jours_restants, "jour")} restant${c.jours_restants > 1 ? "s" : ""}` : "achevé")),
                  h("p", { class: "tres-petit discret" }, [c.niveau_cible ? `vers niveau ${c.niveau_cible}` : null, c.debut_jour ? `commencé jour ${c.debut_jour}` : null].filter(Boolean).join(" · ")),
                ),
              ),
            ),
          ),
        )
      : null,
    (v.habitants ?? []).length
      ? h(
          "div",
          null,
          sectionTitre("Habitants clés"),
          carte(
            h(
              "ul",
              { class: "liste" },
              v.habitants
                .filter((hab) => refs.trouver(hab.pnj))
                .map((hab) =>
                  h(
                    "li",
                    null,
                    h("div", { class: "ligne", style: { minHeight: "auto" } }, h("div", null, refs.lien(hab.pnj), h("p", { class: "tres-petit discret" }, hab.poste)), h("span", { class: "mono petit droite" }, `loyauté ${hab.loyaute}`)),
                    h("div", { style: { marginTop: "4px" } }, barre(hab.loyaute ?? 0, 100, "ok fine")),
                  ),
                ),
            ),
          ),
        )
      : null,
    definitions([["Dernier tour", v.dernier_tick_jour ? `jour ${v.dernier_tick_jour}` : null]]),
  );
  const dernier = contenu.lastElementChild;
  if (dernier?.tagName === "DL") dernier.style.marginTop = "16px";
  return { titre: v.nom, retour, contenu };
}
