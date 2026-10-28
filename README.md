# Chroniques de l'Enclume — PWA compagnon

Compagnon **en lecture seule** des parties stockées dans le repo `enclume`. HTML/CSS/JS modules natifs, sans build. Spec : [docs/SPEC_PWA.md](docs/SPEC_PWA.md).

- **Mode démo** (aucun token) : lit `demo/`.
- **Mode réel** : Réglages → propriétaire, repo, branche, token *fine-grained* (Contents: Read-only, repo `enclume` seul). Le token reste dans le `localStorage` du téléphone.
- **Tests** : servir la racine (`python3 -m http.server`) puis ouvrir `/tests/tests.html`.
- **Debug** : `?debug=1` vérifie `schema_version` de chaque fichier.
- **Mise à jour** : monter `VERSION` dans `js/version.js` **et** `sw.js`.
