// Journal — quêtes, chronologie, résumés de sessions.
import { h, carte, sectionTitre, segments, vide, puce, vider, repli } from "./dom.js";
import { libelle, dateJeu, pluriel } from "./libelles.js";
import { chargerSession } from "../donnees.js";
import { rendreMarkdown } from "../markdown.js";

let importanceMin = 1;

function carteQuete(q, refs) {
  const faites = (q.etapes ?? []).filter((e) => e.faite).length;
  const total = (q.etapes ?? []).length;
  const variante = q.statut === "terminee" ? "ok" : q.statut === "echouee" ? "danger" : "cuivre";
  return carte(
    h(
      "div",
      { class: "carte-tete" },
      h("div", null, h("h3", null, q.titre), h("p", { class: "meta" }, [libelle("type_quete", q.type), refs.nom(q.lieu), total ? `${faites}/${total} étapes` : null].filter(Boolean).join(" · "))),
      puce(libelle("statut_quete", q.statut), variante),
    ),
    q.description ? h("p", { class: "recit", style: { marginTop: "6px" } }, q.description) : null,
    total ? h("ul", { class: "etapes" }, q.etapes.map((e) => h("li", { class: e.faite ? "faite" : "" }, e.texte))) : null,
    h(
      "p",
      { class: "tres-petit tres-discret", style: { marginTop: "6px" } },
      [
        q.donneur && refs.nom(q.donneur) ? `Confiée par ${refs.nom(q.donneur)}` : null,
        q.debut_jour ? `jour ${q.debut_jour}${q.fin_jour ? ` → ${q.fin_jour}` : ""}` : null,
        q.recompense ? `Récompense : ${q.recompense}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );
}

function ecranQuetes(d, refs) {
  const quetes = d.quetes?.quetes ?? [];
  if (!quetes.length) return vide("Aucune quête inscrite au journal.", "📜");
  const groupes = [
    ["active", "Actives"],
    ["terminee", "Terminées"],
    ["echouee", "Échouées"],
  ];
  return h(
    "div",
    null,
    groupes.map(([statut, titre]) => {
      const qs = quetes.filter((q) => q.statut === statut);
      if (!qs.length) return null;
      return h("div", null, sectionTitre(titre, String(qs.length)), qs.map((q) => carteQuete(q, refs)));
    }),
  );
}

function ecranChronologie(d) {
  const evenements = [...(d.chronologie ?? [])].reverse();
  if (!evenements.length) return vide("La chronologie est encore vierge.", "⏳");
  const frise = h("ol", { class: "frise" });
  const compte = h("span", { class: "discret petit" });

  const remplir = () => {
    vider(frise);
    const choisis = evenements.filter((e) => (e.importance ?? 1) >= importanceMin);
    compte.textContent = pluriel(choisis.length, "événement");
    let session = null;
    for (const e of choisis) {
      if (e.session !== session) {
        session = e.session;
        if (session) frise.append(h("li", { style: { listStyle: "none", padding: "4px 0 10px" }, class: "separateur-session" }, h("span", { class: "puce" }, `Session ${session}`)));
      }
      frise.append(h("li", { dataset: { importance: String(e.importance ?? 1) } }, h("div", { class: "date" }, dateJeu(e.date)), h("p", { class: "texte" }, e.texte)));
    }
  };

  const filtres = h(
    "div",
    { class: "segments", role: "group", "aria-label": "Filtrer par importance" },
    [
      [1, "Tout"],
      [2, "●● et plus"],
      [3, "●●● majeurs"],
    ].map(([n, lib]) =>
      h(
        "button",
        {
          type: "button",
          "aria-pressed": importanceMin === n ? "true" : "false",
          onclick: (ev) => {
            importanceMin = n;
            for (const b of filtres.querySelectorAll("button")) b.setAttribute("aria-pressed", "false");
            ev.currentTarget.setAttribute("aria-pressed", "true");
            remplir();
          },
        },
        lib,
      ),
    ),
  );
  remplir();
  return h("div", null, filtres, h("div", { style: { margin: "-6px 0 12px", textAlign: "right" } }, compte), carte(frise));
}

function ecranSessions(d, pid, forcer) {
  const n = d.partie?.session ?? 0;
  if (!n) return vide("Aucune session jouée.", "📜");
  const conteneur = h("div");
  const blocs = [];
  for (let i = n; i >= 1; i--) {
    const corps = h("div", null, h("p", { class: "chargement petit", style: { padding: "8px 0" } }, "…"));
    const titre = h("strong", null, `Session ${i}`);
    const bloc = repli(titre, corps, i === n);
    blocs.push({ i, corps, titre, bloc });
    conteneur.append(bloc);
  }
  // Une seule vague de lectures en parallèle.
  for (const { i, corps, titre } of blocs) {
    chargerSession(pid, i, { forcer })
      .then((md) => {
        vider(corps);
        if (!md) {
          corps.append(h("p", { class: "petit discret" }, "Résumé absent."));
          return;
        }
        const rendu = rendreMarkdown(md);
        const h1 = rendu.querySelector("h2");
        // « # Session 9 — Cendre-Veine » : le titre passe dans la ligne repliable
        if (h1 && /^Session\s+\d+/i.test(h1.textContent)) {
          titre.textContent = h1.textContent;
          h1.remove();
        }
        corps.append(rendu);
      })
      .catch((err) => {
        vider(corps);
        corps.append(h("p", { class: "petit", style: { color: "var(--danger)" } }, err.message));
      });
  }
  return carte(conteneur);
}

export function rendre({ d, refs, reste, pid, forcer }) {
  const sous = ["quetes", "chronologie", "sessions"].includes(reste[0]) ? reste[0] : "quetes";
  const base = refs.base;
  const vues = { quetes: () => ecranQuetes(d, refs), chronologie: () => ecranChronologie(d), sessions: () => ecranSessions(d, pid, forcer) };
  const contenu = h(
    "div",
    null,
    h("h1", { style: { fontSize: "1.75rem", marginBottom: "10px" } }, "Journal"),
    segments(
      [
        ["quetes", "Quêtes", `${base}/journal/quetes`],
        ["chronologie", "Chronologie", `${base}/journal/chronologie`],
        ["sessions", "Sessions", `${base}/journal/sessions`],
      ],
      sous,
    ),
    vues[sous](),
  );
  return { titre: d.partie?.nom ?? "Journal", retour: "#/", contenu };
}
