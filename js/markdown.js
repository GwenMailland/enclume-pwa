// Rendu markdown simple et sûr : construit des nœuds DOM, le texte n'est
// jamais interprété comme du HTML. Gère titres, paragraphes, listes,
// citations, **gras**, *italique* et `code`.
import { h } from "./ui/dom.js";

function enLigne(texte) {
  const noeuds = [];
  const motif = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  let dernier = 0;
  let m;
  while ((m = motif.exec(texte))) {
    if (m.index > dernier) noeuds.push(texte.slice(dernier, m.index));
    if (m[2]) noeuds.push(h("strong", null, m[2]));
    else if (m[3] || m[4]) noeuds.push(h("em", null, m[3] || m[4]));
    else if (m[5]) noeuds.push(h("code", { class: "code" }, m[5]));
    dernier = motif.lastIndex;
  }
  if (dernier < texte.length) noeuds.push(texte.slice(dernier));
  return noeuds;
}

export function rendreMarkdown(source) {
  const racine = h("div", { class: "md recit" });
  const lignes = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  let paragraphe = [];
  let liste = null;
  let citation = null;

  const fermer = () => {
    if (paragraphe.length) {
      racine.append(h("p", null, enLigne(paragraphe.join(" "))));
      paragraphe = [];
    }
    liste = null;
    citation = null;
  };

  for (const brute of lignes) {
    const ligne = brute.trimEnd();
    let m;
    if (!ligne.trim()) {
      fermer();
    } else if ((m = ligne.match(/^(#{1,6})\s+(.*)$/))) {
      fermer();
      const niveau = Math.min(m[1].length + 1, 4); // h1 de l'écran déjà pris
      racine.append(h(`h${niveau}`, null, enLigne(m[2])));
    } else if ((m = ligne.match(/^\s*[-*+]\s+(.*)$/)) || (m = ligne.match(/^\s*\d+[.)]\s+(.*)$/))) {
      if (paragraphe.length) fermer();
      const ordonnee = /^\s*\d/.test(ligne);
      if (!liste || liste.tagName !== (ordonnee ? "OL" : "UL")) {
        liste = h(ordonnee ? "ol" : "ul");
        racine.append(liste);
      }
      liste.append(h("li", null, enLigne(m[1])));
    } else if ((m = ligne.match(/^>\s?(.*)$/))) {
      if (paragraphe.length) fermer();
      if (!citation) {
        citation = h("blockquote");
        racine.append(citation);
      }
      citation.append(h("p", null, enLigne(m[1])));
    } else if (/^(-{3,}|\*{3,})$/.test(ligne.trim())) {
      fermer();
      racine.append(h("hr"));
    } else {
      liste = null;
      citation = null;
      paragraphe.push(ligne.trim());
    }
  }
  fermer();
  return racine;
}
