# PWA compagnon — Chroniques de l'Enclume

PWA **lecture seule** qui affiche les parties du jeu stockées dans le repo privé `enclume` (via l'API GitHub). La spec complète est dans `docs/SPEC_PWA.md`.

## Règles
- **HTML/CSS/JS modules natifs, sans build.** Déploiement GitHub Pages depuis `main`.
- **Le contrat de données** est `schemas/` (copie du repo `enclume`). Ne le modifie pas ici. Si tu as besoin d'un changement, note-le dans `DEMANDES.md` pour l'architecte du repo `enclume`.
- **Développe contre `demo/`** (fixture). Le mode réel ne fait que changer la source.
- **Sécurité** :
  - jamais de token dans le code ou les commits ;
  - filtrage systématique des secrets (`js/filtre.js`) ;
  - aucune écriture vers GitHub.
- **Français** partout dans l'interface. Sobre, ambiance parchemin + fenêtres Système (spec §5).
- Si on te dit « tu es l'agent pwa-ui » : lis `.claude/agents/pwa-ui.md`.
