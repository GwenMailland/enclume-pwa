// Réglages — connexion GitHub (token en localStorage uniquement), cache, version.
import { h, carte, sectionTitre } from "./dom.js";
import { lireConfig, ecrireConfig, effacerConfig, modeDemo, testerConnexion, viderTousLesCaches } from "../donnees.js";
import { VERSION } from "../version.js";

export function rendre({ global, refs, rerendre }) {
  const config = lireConfig();
  const demo = modeDemo(config);
  const message = h("p", { class: "message", role: "status", "aria-live": "polite" });
  const dire = (texte, type = "") => {
    message.textContent = texte;
    message.className = `message ${type}`.trim();
  };

  const champ = (libelle, attrs) => h("label", { class: "champ" }, h("span", null, libelle), h("input", attrs));
  const owner = champ("Propriétaire (compte GitHub)", { name: "owner", value: config.owner, placeholder: "ton-pseudo", autocapitalize: "off", autocomplete: "off", spellcheck: "false" });
  const repo = champ("Repo", { name: "repo", value: config.repo, placeholder: "enclume", autocapitalize: "off", autocomplete: "off", spellcheck: "false" });
  const branche = champ("Branche", { name: "branche", value: config.branche, placeholder: "main", autocapitalize: "off", autocomplete: "off", spellcheck: "false" });
  const token = champ("Token (fine-grained, lecture seule)", {
    name: "token",
    type: "password",
    value: "",
    placeholder: config.token ? "•••• enregistré — laisser vide pour le garder" : "github_pat_…",
    autocapitalize: "off",
    autocomplete: "off",
    spellcheck: "false",
  });

  const valeurs = () => {
    const v = (el) => el.querySelector("input").value.trim();
    return { owner: v(owner), repo: v(repo), branche: v(branche), token: v(token) || config.token };
  };

  const formulaire = h(
    "form",
    {
      onsubmit: (e) => {
        e.preventDefault();
        const v = valeurs();
        if (v.token && !v.owner) {
          dire("Indique le propriétaire du repo.", "erreur");
          return;
        }
        ecrireConfig(v);
        dire(v.token ? "Réglages enregistrés. Mode réel actif." : "Réglages enregistrés (mode démo : pas de token).", "ok");
        setTimeout(rerendre, 600);
      },
    },
    owner,
    repo,
    branche,
    token,
    h(
      "div",
      { class: "actions" },
      h("button", { class: "btn plein", type: "submit" }, "Enregistrer"),
      h(
        "button",
        {
          class: "btn",
          type: "button",
          onclick: async (e) => {
            const bouton = e.currentTarget;
            bouton.disabled = true;
            dire("Test en cours…");
            try {
              dire(await testerConnexion(valeurs()), "ok");
            } catch (err) {
              dire(err.message, "erreur");
            } finally {
              bouton.disabled = false;
            }
          },
        },
        "Tester la connexion",
      ),
    ),
    message,
  );

  const contenu = h(
    "div",
    null,
    h("h1", { style: { fontSize: "1.75rem", marginBottom: "10px" } }, "Réglages"),
    carte(
      h("div", { class: "ligne", style: { minHeight: "auto" } }, h("strong", null, "Mode"), h("span", { class: `puce ${demo ? "cuivre" : "ok"}` }, demo ? "Démo" : "Réel")),
      h("p", { class: "petit discret", style: { marginTop: "4px" } }, demo ? "Aucun token : la PWA affiche la partie d'exemple. Ajoute un token pour lire tes vraies parties." : `Lecture de ${config.owner}/${config.repo} sur la branche ${config.branche}.`),
    ),
    sectionTitre("Connexion GitHub"),
    carte(formulaire),
    sectionTitre("Créer le token"),
    carte(
      h(
        "ol",
        { class: "etapes-guide" },
        h("li", null, "Sur GitHub : ", h("strong", null, "Settings → Developer settings → Personal access tokens → Fine-grained tokens"), ", puis « Generate new token »."),
        h("li", null, "Donne-lui un nom (ex. « Enclume iPhone ») et une date d'expiration."),
        h("li", null, h("strong", null, "Repository access"), " : « Only select repositories », puis choisis uniquement ", h("span", { class: "code" }, "enclume"), "."),
        h("li", null, h("strong", null, "Permissions → Repository → Contents"), " : « Read-only ». Ne coche rien d'autre."),
        h("li", null, "Génère le token, copie-le (il commence par ", h("span", { class: "code" }, "github_pat_"), "), colle-le ci-dessus, puis « Tester la connexion »."),
      ),
      h("p", { class: "tres-petit discret", style: { marginTop: "10px" } }, "Le token reste dans ce téléphone (stockage local). Il n'est jamais envoyé ailleurs qu'à api.github.com, et la PWA ne fait que des lectures."),
    ),
    sectionTitre("Données"),
    carte(
      h(
        "div",
        { class: "actions", style: { marginTop: 0 } },
        h(
          "button",
          {
            class: "btn",
            type: "button",
            onclick: async () => {
              await viderTousLesCaches();
              dire("Cache vidé. Les données seront relues au prochain affichage.", "ok");
            },
          },
          "Vider le cache",
        ),
        h(
          "button",
          {
            class: "btn danger",
            type: "button",
            onclick: async () => {
              if (!confirm("Effacer le token et les réglages de ce téléphone ?")) return;
              effacerConfig();
              await viderTousLesCaches();
              dire("Réglages effacés. Retour au mode démo.", "ok");
              setTimeout(rerendre, 600);
            },
          },
          "Effacer",
        ),
      ),
      h("p", { class: "tres-petit discret", style: { marginTop: "10px" } }, "« Effacer » supprime le token, le repo, la branche et les heures de synchro, puis repasse en mode démo."),
    ),
    h("p", { class: "tres-petit tres-discret", style: { textAlign: "center", marginTop: "24px" } }, `Chroniques de l'Enclume — compagnon v${VERSION} · lecture seule`),
  );
  return { titre: "Réglages", retour: global ? "#/" : `${refs.base}/plus`, contenu };
}
