# Spécification — PWA compagnon

## 1. But
Consulter sur iPhone l'état complet de ses parties des Chroniques de l'Enclume. **Lecture seule.** On joue dans Claude Code, on consulte ici.

## 2. Contraintes
- **HTML + CSS + JS modules natifs, sans build, sans framework.** Une petite lib via CDN est tolérée si elle est vraiment utile (aucune requise).
- Hébergement **GitHub Pages** (repo public). Installable via « Sur l'écran d'accueil » de Safari (`manifest.webmanifest`, icônes, `apple-mobile-web-app-capable`).
- **Mobile first** : 390 px de large, gouttières de 16 px, pas de scroll horizontal. Zones tactiles ≥ 44 px. Respect de `safe-area-inset`.
- **Hors ligne** : un service worker met en cache la coquille et le **dernier état chargé** de chaque partie. L'heure de dernière synchro est affichée.

## 3. Données
- **Source réelle** : API GitHub `GET https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branche}`, en-tête `Authorization: Bearer <token>`, `Accept: application/vnd.github.raw+json`.
- **Réglages** (stockés en `localStorage`, avec un bouton « Effacer ») : owner, repo (`enclume` par défaut), branche (`main` par défaut), token.
  - Le token est un *fine-grained token*, permission *Contents: Read-only*, limité au repo `enclume`.
  - L'écran Réglages explique comment le créer, en 5 étapes.
- **Mode démo** : lit `demo/` (copie de `fixtures/partie-demo` du repo `enclume`). Actif tant qu'aucun token n'est configuré, avec un bandeau « Démo ».
- **Chargement d'une partie** : `parties/index.json`, puis les fichiers de `parties/<id>/` en parallèle.
  - Cache mémoire et cache SW.
  - Bouton ↻ de rafraîchissement.
  - Pour la chronologie : une seule lecture du `.jsonl` (parse ligne à ligne).
- **Filtrage obligatoire** (module `js/filtre.js`, testé) :
  - supprimer récursivement toute clé `secret` / `secrets` ;
  - supprimer les entrées `connu: false` ;
  - supprimer les stats cachées non débloquées ;
  - ne jamais lire `memoire.md` ni `bugs.md`.
- **Règles dérivées** : `js/regles.js` réplique les formules du GDD §3.2 (modificateur, PV max, PM max, Défense…). Un commentaire en tête indique de les garder synchronisées avec le moteur.
- **Schémas** : `schemas/` (copie). En mode debug (`?debug=1`), la PWA vérifie `schema_version` et avertit en cas d'écart.

## 4. Écrans

**Accueil — Mes parties** : une carte par partie (nom, héros, niveau, classe, lieu, date du jeu, session n°, statut ⚔️ en cours / 🕯️ terminée, dernière synchro).

À l'intérieur d'une partie : **barre d'onglets en bas** (5 onglets : Héros · Sac · Codex · Journal · Plus). « Plus » ouvre Système, Ville, Destinée, Jets, Réglages.

| Écran | Contenu |
|---|---|
| **Héros** | En-tête (nom, niveau, barre XP, rang Système, classe + rang, titres actifs). Ressources en barres (PV, PM, ⚡). **Tableau des stats** : stat · valeur · mod · barre d'usage vers le prochain +1. Stats cachées débloquées (style Système). Dérivées. Métiers (niveaux). Compétences (liste repliable : type, niveau, coût, description). Malus actifs. Points non dépensés en évidence. |
| **Sac** | Équipement par emplacement. Inventaire filtrable (type, qualité), couleurs de qualité. Matériaux (rang, quantité). Or. Fiche d'objet : stats, affixes, durabilité, lignée et éveil, histoire pour les Unique et Légendaire. |
| **Forge** (dans Sac) | Maîtrise de forge, recettes connues (matériaux requis, possédés ✓/✗), historique des créations, galerie des objets Unique et Légendaire. |
| **Codex** | Sous-onglets PNJ · Lieux · Factions · Bestiaire · Objets · Noms. **Recherche globale** insensible aux accents. Fiche PNJ : rôle, lieu, statut, affinité (jauge −100 à +100), voix, souvenirs (datés), dernier échange, liens. Factions : réputation. Noms : dictionnaire alphabétique avec type et lien. |
| **Journal** | Quêtes (actives / terminées / échouées, étapes). **Chronologie** verticale (date du jeu, importance par taille de point, filtre par importance), résumés de sessions (markdown rendu simple). |
| **Système** | Rang, quêtes quotidiennes du jour (progression), quêtes du Système, brèches connues (rang, région, état, compte à rebours). |
| **Ville** | Masqué si non débloquée (« Aucune terre à ton nom… pour l'instant »). Palier, ressources (tableau), jauges Moral/Défense/Renommée, bâtiments (niveau, effet), chantiers (jours restants), habitants clés. |
| **Destinée** | Frise des choix irréversibles : choix fait, date, ce qu'il a ouvert / verrouillé. |
| **Jets** | Historique des jets (dernier en premier) : stat, total vs DD, degré (icône), raison. Petites stats : taux de réussite, critiques, fiascos. |
| **Réglages** | Connexion GitHub, test de connexion, branche, mode démo, vider le cache, version. |

## 5. Direction artistique : sobre, ambiance « mix »

Deux registres qui cohabitent :
- **Parchemin et encre** pour le récit, le codex et le journal :
  - fond quasi noir chaud `#14110f`, surfaces `#1d1916` ;
  - texte parchemin `#e8dcc4`, secondaire `#a89a82` ;
  - accent cuivre de forge `#c8833a` ;
  - titres en serif (Cormorant Garamond ou EB Garamond via Google Fonts), corps en serif lisible ou sans sobre.
- **Fenêtres Système** pour les stats, les notifications, Système et les jets :
  - panneaux `#0d1520` à bordure fine `#3fa7d6` (60 % d'opacité), lueur très légère ;
  - texte `#d6ecf7` ;
  - chiffres en mono (JetBrains Mono) ;
  - coins légèrement coupés (`clip-path`).
- **Couleurs de qualité** : Ordinaire `#b9b2a6`, Fine `#6fbf73`, Rare `#4f9de0`, Épique `#a46be0`, Unique `#e0a23f`, Légendaire `#e05a3f` (avec un liseré animé lent et discret, désactivé si `prefers-reduced-motion`).
- **Thème sombre uniquement**, cohérent avec l'ambiance. Variables CSS dans `:root`.
- **Animations** : minimes (apparition 150 ms). Pas d'images lourdes. Icônes en SVG inline ou emoji sobres.

## 6. Structure du repo

```
enclume-pwa/
├─ index.html  manifest.webmanifest  sw.js
├─ css/  tokens.css  base.css  composants.css
├─ js/   app.js  routeur.js  donnees.js  filtre.js  regles.js  ui/*.js (un module par écran)
├─ icons/
├─ demo/      copie de fixtures/partie-demo + parties/index.json de démo
├─ schemas/   copie des schémas
└─ tests/     tests.html (tests unitaires dans le navigateur : filtre, regles, parse jsonl)
```

## 7. Critères d'acceptation
- [ ] En mode démo, tous les écrans affichent la fixture sans erreur console.
- [ ] Aucun `secret` ni entrée `connu: false` n'est visible (test dédié).
- [ ] Rendu propre à 390 px et à 430 px. Installable sur l'écran d'accueil iOS.
- [ ] Hors ligne : la dernière partie consultée s'ouvre.
- [ ] Avec un vrai token : la liste des parties et une partie complète se chargent en moins de 3 s en 4G.
