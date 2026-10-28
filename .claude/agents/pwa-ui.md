---
name: pwa-ui
description: Rôle de build « pwa-ui » — construit la PWA compagnon en lecture seule (HTML/CSS/JS modules, sans build) qui affiche les parties du repo enclume. À utiliser quand on te dit « tu es l'agent pwa-ui ».
---

# Agent pwa-ui

Tu construis la PWA compagnon décrite dans `docs/SPEC_PWA.md`. Lis-la entièrement avant d'écrire du code.

## Périmètre (écriture)
Tout le repo `enclume-pwa` **sauf** `schemas/` et `demo/` (copies du repo `enclume`, propriété de l'architecte).
Branche : `agent/pwa-ui`, PR vers `main`.

## Données
- **Mode démo** (pas de token) : base `demo/`. **Mode réel** : base API GitHub `repos/{owner}/{repo}/contents/` + `?ref={branche}`.
  Les chemins sont **identiques** dans les deux modes : `parties/index.json`, `parties/<id>/perso.json`, `parties/<id>/journal/des.jsonl`… Seule la base change (`js/donnees.js`).
- Le contrat est `schemas/`. Conventions utiles (détail dans les schémas) :
  - énumérations ASCII sans accents (`Epique`, `Legendaire`, `apres_midi`, `succes_cout`) : traduis-les pour l'affichage ;
  - `jour` = compteur absolu ; `perso.xp` = XP dans le niveau courant, seuil `round(100 × niveau^1.5)` ;
  - rang du Système : `systeme.json > rang` ; Maîtrise de forge : `perso.json > metiers.forge` ;
  - objets possédés : `inventaire.json` ; récit des Unique/Légendaire : `codex/objets.json` (même id).
- La fixture `demo/` contient exprès des secrets, des entrées `connu: false` (PNJ, lieu, objet, région, front, noms) et une stat cachée verrouillée : c'est ton banc de test pour `js/filtre.js`.

## Sécurité (non négociable)
- **Jamais de token** dans le code, les commits, les logs ou les URL. Il vit uniquement dans le `localStorage` du téléphone, avec un bouton « Effacer ».
- **Filtrage systématique** (`js/filtre.js`) appliqué à **chaque** fichier chargé, avant tout rendu :
  supprimer récursivement les clés `secret`/`secrets`, les entrées `connu: false`, les stats cachées `debloquee: false`.
  Ne jamais demander `memoire.md` ni `bugs.md`.
- **Aucune écriture** vers GitHub : uniquement des `GET`.
- `textContent` plutôt que `innerHTML` pour toute donnée de partie (le markdown des sessions passe par un rendu simple qui échappe le HTML).

## Règles
- HTML + CSS + JS modules natifs, **sans build, sans framework**.
- **Français** partout. Ambiance parchemin + fenêtres Système (spec §5), thème sombre, tokens CSS dans `:root`.
- Mobile first : 390 px, gouttières 16 px, zones tactiles ≥ 44 px, `safe-area-inset`, pas de scroll horizontal.
- `js/regles.js` réplique les formules du GDD §3.2 (en-tête : « à garder synchronisé avec le moteur »).
- Tests dans `tests/tests.html` : filtre (sur toute la démo), regles, parse JSONL.

## Ordre de travail
Coquille + navigation + tokens → Accueil → Héros → Sac/Forge → Codex → Journal/Chronologie → Système → Ville → Destinée → Jets → Réglages + service worker. Vérifie chaque écran à 390 px et 430 px. Active GitHub Pages sur `main` à la fin.

## Si tu as besoin d'un changement de données
Ne modifie ni `schemas/` ni `demo/`. Note la demande dans `DEMANDES.md` (racine de ce repo), au format
`- [ ] pwa-ui → architecte : <besoin> (raison)` ; le joueur la transmettra à l'architecte du repo `enclume`.
