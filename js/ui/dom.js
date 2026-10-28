// Petits utilitaires DOM. Toute donnée de partie passe par des nœuds texte
// (jamais innerHTML).

export function h(tag, attrs, ...enfants) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    }
  }
  ajouter(el, enfants);
  return el;
}

function ajouter(el, enfants) {
  for (const e of enfants) {
    if (e === null || e === undefined || e === false || e === "") continue;
    if (Array.isArray(e)) ajouter(el, e);
    else if (e instanceof Node) el.appendChild(e);
    else el.appendChild(document.createTextNode(String(e)));
  }
}

export function fragment(...enfants) {
  const f = document.createDocumentFragment();
  ajouter(f, enfants);
  return f;
}

export function vider(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function sectionTitre(titre, aside) {
  return h("div", { class: "section-titre" }, h("h2", null, titre), aside ? h("span", { class: "discret" }, aside) : null);
}

export function fenetre(titre, droite, ...enfants) {
  return h(
    "section",
    { class: "fenetre" },
    h("div", { class: "fenetre-titre" }, h("span", null, titre), droite ? h("span", null, droite) : null),
    ...enfants,
  );
}

export function carte(...enfants) {
  return h("div", { class: "carte" }, ...enfants);
}

export function barre(valeur, max, variante = "") {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valeur / max) * 100)) : 0;
  return h(
    "div",
    { class: `barre ${variante}`.trim(), role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": valeur },
    h("span", { style: { width: `${pct}%` } }),
  );
}

// Jauge de −100 à +100 centrée sur 0.
export function jaugeCentree(valeur, borne = 100) {
  const v = Math.max(-borne, Math.min(borne, valeur ?? 0));
  const largeur = (Math.abs(v) / borne) * 50;
  const span = h("span", { class: v >= 0 ? "pos" : "neg" });
  span.style.width = `${largeur}%`;
  span.style.left = v >= 0 ? "50%" : `${50 - largeur}%`;
  return h("div", { class: "jauge-centree", role: "meter", "aria-valuemin": -borne, "aria-valuemax": borne, "aria-valuenow": v }, span);
}

export function definitions(paires) {
  const dl = h("dl", { class: "definitions" });
  for (const [terme, valeur] of paires) {
    if (valeur === null || valeur === undefined || valeur === "" || (Array.isArray(valeur) && !valeur.length)) continue;
    dl.append(h("dt", null, terme), h("dd", null, valeur));
  }
  return dl.childElementCount ? dl : null;
}

export function puce(texte, variante = "") {
  return h("span", { class: `puce ${variante}`.trim() }, texte);
}

export function vide(texte, icone = "🕯️") {
  return h("div", { class: "vide" }, h("div", { class: "icone-grande", "aria-hidden": "true" }, icone), h("p", { class: "recit" }, texte));
}

export function repli(resume, contenu, ouvert = false) {
  return h("details", { class: "repli", open: ouvert }, h("summary", null, resume), h("div", { class: "contenu" }, contenu));
}

export function segments(entrees, actif) {
  return h(
    "nav",
    { class: "segments", "aria-label": "Sous-sections" },
    entrees.map(([cle, libelle, href]) => h("a", { href, "aria-current": cle === actif ? "page" : null }, libelle)),
  );
}

export function normaliser(texte) {
  return String(texte ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
