// Coquille de l'application : routage, en-tête, onglets, bandeau, rafraîchissement.
import { lireRoute, surChangement } from "./routeur.js";
import { chargerIndex, chargerPartie, modeDemo, lireAvertissements, debug } from "./donnees.js";
import { construireReferences } from "./references.js";
import { h, vider } from "./ui/dom.js";
import { heureLocale } from "./ui/libelles.js";
import * as accueil from "./ui/accueil.js";
import * as heros from "./ui/heros.js";
import * as sac from "./ui/sac.js";
import * as codex from "./ui/codex.js";
import * as journal from "./ui/journal.js";
import * as plus from "./ui/plus.js";
import * as systeme from "./ui/systeme.js";
import * as ville from "./ui/ville.js";
import * as destinee from "./ui/destinee.js";
import * as jets from "./ui/jets.js";
import * as reglages from "./ui/reglages.js";

const ECRANS = { heros, sac, codex, journal, plus, systeme, ville, destinee, jets, reglages };
const ONGLET_DE = { systeme: "plus", ville: "plus", destinee: "plus", jets: "plus", reglages: "plus" };

const $vue = document.getElementById("vue");
const $titre = document.getElementById("titre");
const $retour = document.getElementById("btn-retour");
const $rafraichir = document.getElementById("btn-rafraichir");
const $bandeau = document.getElementById("bandeau");
const $onglets = document.getElementById("onglets");

let jeton = 0;
let derniereCle = "";

function majEntete({ titre, retour }) {
  $titre.textContent = titre || "Chroniques de l'Enclume";
  document.title = titre ? `${titre} — Enclume` : "Chroniques de l'Enclume";
  if (retour) {
    $retour.hidden = false;
    $retour.href = retour;
  } else {
    $retour.hidden = true;
  }
}

function majBandeau({ synchro, horsLigne } = {}) {
  vider($bandeau);
  if (modeDemo()) $bandeau.append(h("span", { class: "pastille-demo" }, "Démo"));
  if (horsLigne) $bandeau.append(h("span", { class: "hors-ligne" }, "Hors ligne"));
  if (synchro) $bandeau.append(h("span", null, `Synchro ${heureLocale(synchro)}`));
  else if (modeDemo()) $bandeau.append(h("span", null, "Données d'exemple"));
  for (const a of debug ? lireAvertissements() : []) {
    $bandeau.after(h("div", { class: "alerte-debug" }, `⚠ ${a}`));
  }
}

function majOnglets(route) {
  const actifs = route.ecran === "partie";
  document.body.classList.toggle("avec-onglets", actifs);
  if (!actifs) return;
  const courant = ONGLET_DE[route.onglet] ?? route.onglet;
  for (const a of $onglets.querySelectorAll("[data-onglet]")) {
    a.href = `#/p/${encodeURIComponent(route.pid)}/${a.dataset.onglet}`;
    if (a.dataset.onglet === courant) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

function afficher(contenu) {
  vider($vue);
  $vue.append(contenu);
  // relance l'animation d'apparition
  $vue.style.animation = "none";
  void $vue.offsetWidth;
  $vue.style.animation = "";
}

function afficherErreur(err) {
  afficher(
    h(
      "div",
      { class: "vide" },
      h("div", { class: "icone-grande", "aria-hidden": "true" }, "⚠️"),
      h("p", { class: "recit" }, "Le parchemin reste muet."),
      h("p", { class: "petit", style: { marginTop: "8px" } }, err?.message || String(err)),
      h("div", { class: "actions", style: { justifyContent: "center" } }, h("a", { class: "btn", href: "#/reglages" }, "Ouvrir les Réglages"), h("a", { class: "btn", href: "#/" }, "Mes parties")),
    ),
  );
}

async function rendre({ forcer = false } = {}) {
  const moi = ++jeton;
  const route = lireRoute();
  const cle = location.hash;
  majOnglets(route);
  document.querySelectorAll(".alerte-debug").forEach((e) => e.remove());

  try {
    let resultat;
    let etat = {};
    if (route.ecran === "accueil") {
      const index = await chargerIndex({ forcer });
      etat = index;
      resultat = accueil.rendre({ index });
    } else if (route.ecran === "reglages") {
      resultat = reglages.rendre({ global: true, rerendre: () => rendre() });
    } else {
      const charge = await chargerPartie(route.pid, { forcer });
      etat = charge;
      const ecran = ECRANS[route.onglet] ?? heros;
      const refs = construireReferences(charge.donnees, route.pid);
      resultat = ecran.rendre({ pid: route.pid, d: charge.donnees, refs, reste: route.reste, charge, forcer, rerendre: () => rendre() });
    }
    if (moi !== jeton) return;
    majEntete(resultat);
    majBandeau(etat);
    afficher(resultat.contenu);
    if (cle !== derniereCle) window.scrollTo(0, 0);
    derniereCle = cle;
  } catch (err) {
    if (moi !== jeton) return;
    console.warn(err);
    majEntete({ titre: "Erreur", retour: route.ecran === "accueil" ? null : "#/" });
    majBandeau();
    afficherErreur(err);
  }
}

$rafraichir.addEventListener("click", async () => {
  $rafraichir.classList.add("tourne");
  $rafraichir.disabled = true;
  try {
    await rendre({ forcer: true });
  } finally {
    $rafraichir.classList.remove("tourne");
    $rafraichir.disabled = false;
  }
});

surChangement(() => rendre());
rendre();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker non installé", e));
}
