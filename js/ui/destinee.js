// Destinée — frise des choix irréversibles, arc en actes, menaces en cours.
import { h, carte, vide, sectionTitre, puce } from "./dom.js";
import { libelle, dateJeu, humaniser } from "./libelles.js";

const GENRES = { allegeance: "Allégeance", rang: "Rang", contrat: "Contrat", voie: "Voie", classe: "Classe", quete: "Quête", lieu: "Lieu", pnj: "PNJ", titre: "Titre", recette: "Recette" };
const ID_ENTITE = /^[a-z]+_[a-z0-9_]+_[0-9a-f]{4}$/;

// « allegeance:fac_cercle_des_cendres_2a71 » → « Allégeance : Cercle des Cendres »
function texteEffet(effet, refs) {
  const [genre, ...resteValeur] = String(effet).split(":");
  const valeur = resteValeur.join(":");
  const etiquette = GENRES[genre] ?? humaniser(genre);
  if (!valeur) return etiquette;
  const nom = refs.nom(valeur);
  if (nom) return `${etiquette} : ${nom}`;
  if (ID_ENTITE.test(valeur)) return `${etiquette} : ???`; // entité inconnue du joueur
  return `${etiquette} : ${humaniser(valeur).toLowerCase()}`;
}

function choix(c, refs) {
  return h(
    "li",
    { dataset: { importance: "3" } },
    h("div", { class: "date" }, [dateJeu(c.date), c.session ? `session ${c.session}` : null].filter(Boolean).join(" · ")),
    carte(
      h("div", { class: "carte-tete" }, h("h3", null, c.titre), puce(libelle("type_destinee", c.type), "cuivre")),
      c.contexte ? h("p", { class: "petit discret", style: { marginTop: "6px" } }, c.contexte) : null,
      h("p", { class: "citation", style: { marginTop: "10px" } }, c.choix),
      c.alternatives?.length
        ? h(
            "div",
            { style: { marginTop: "10px" } },
            h("p", { class: "tres-petit discret" }, "Chemins non pris"),
            h("ul", { class: "etapes" }, c.alternatives.map((a) => h("li", { style: { textDecoration: "line-through", color: "var(--texte-3)" } }, a))),
          )
        : null,
      c.ouvre?.length ? h("div", { style: { marginTop: "10px" } }, h("p", { class: "tres-petit discret" }, "A ouvert"), h("div", { class: "puces", style: { marginTop: "4px" } }, c.ouvre.map((o) => puce(`🔓 ${texteEffet(o, refs)}`, "ok")))) : null,
      c.verrouille?.length ? h("div", { style: { marginTop: "8px" } }, h("p", { class: "tres-petit discret" }, "A verrouillé"), h("div", { class: "puces", style: { marginTop: "4px" } }, c.verrouille.map((o) => puce(`🔒 ${texteEffet(o, refs)}`, "danger")))) : null,
    ),
  );
}

function arc(monde) {
  const a = monde?.arc;
  if (!a?.actes?.length) return null;
  return h(
    "div",
    null,
    sectionTitre("L'arc", `acte ${a.acte_courant} / ${a.actes.length}`),
    carte(
      h(
        "ul",
        { class: "liste" },
        a.actes.map((acte) => {
          const courant = acte.numero === a.acte_courant;
          const passe = acte.numero < a.acte_courant;
          return h(
            "li",
            { style: { opacity: acte.numero > a.acte_courant ? 0.55 : 1 } },
            h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", { style: { color: courant ? "var(--cuivre-clair)" : null } }, `Acte ${acte.numero} — ${acte.nom}`), courant ? puce("en cours", "cuivre") : passe ? puce("accompli", "ok") : null),
            acte.numero <= a.acte_courant
              ? h(
                  "ul",
                  { class: "etapes" },
                  (acte.jalons ?? []).map((j) => h("li", { class: j.atteint ? "faite" : "" }, j.titre, j.atteint && j.jour ? h("span", { class: "tres-discret" }, ` · jour ${j.jour}`) : null)),
                )
              : h("p", { class: "tres-petit tres-discret" }, `${(acte.jalons ?? []).length} jalon${(acte.jalons ?? []).length > 1 ? "s" : ""} à venir`),
          );
        }),
      ),
    ),
  );
}

function fronts(monde, refs) {
  const fs = monde?.fronts ?? [];
  if (!fs.length) return null;
  return h(
    "div",
    null,
    sectionTitre("Ce qui se trame"),
    fs.map((f) =>
      carte(
        h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, f.nom), h("span", { class: "mono petit droite" }, `${f.rempli}/${f.segments}`)),
        refs.nom(f.source) ? h("p", { class: "tres-petit discret" }, refs.nom(f.source)) : null,
        h("div", { class: "horloge", "aria-label": `${f.rempli} segments sur ${f.segments}` }, Array.from({ length: f.segments }, (_, i) => h("span", { class: i < f.rempli ? "plein" : "" }))),
      ),
    ),
  );
}

export function rendre({ d, refs }) {
  const liste = [...(d.destinee?.choix ?? [])].sort((a, b) => (b.date?.jour ?? 0) - (a.date?.jour ?? 0));
  const contenu = h(
    "div",
    null,
    h("h1", { style: { fontSize: "1.75rem" } }, "Destinée"),
    h("p", { class: "discret recit", style: { fontStyle: "italic", marginBottom: "16px" } }, "Ce qui est forgé ne se reforge pas."),
    liste.length ? h("ol", { class: "frise" }, liste.map((c) => choix(c, refs))) : vide("Aucun choix irréversible… pour l'instant.", "✶"),
    arc(d.monde),
    fronts(d.monde, refs),
  );
  return { titre: "Destinée", retour: `${refs.base}/plus`, contenu };
}
