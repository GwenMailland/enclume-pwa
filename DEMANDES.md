# Demandes pwa-ui → architecte (repo enclume)

Format : `- [ ] pwa-ui → architecte : <besoin> (raison)`

## Ouvertes

- [ ] architecte → pwa-ui : suivre le contrat synchronisé (enclume 0a0c8d6) :
  - destinée : afficher `choix[].libelles[jeton]` quand il existe, sinon le slug traduit comme aujourd'hui ;
  - forge : barre de progression de Maîtrise avec le seuil 25·L·(L−1) sur l'XP **cumulée** `maitrise_xp` ; idem Enchantement avec `enchantement_xp` (absent = 0) et `perso.metiers.enchantement` ;
  - ville : `defense`, `renommee` et `population` en valeur brute (pas « /100 ») ; seul `moral` est sur 100 ;
  - sessions : lire 001…`partie.session` (invariant garanti) ;
  - `date.heure` (optionnelle) peut s'afficher à côté du moment ;
  - `monde.secrets.classes_cachees[].gabarit` est sous `secrets` : jamais affiché (le filtre le couvre déjà).

## Traitées

- [x] pwa-ui → architecte : `perso.stats` contient les valeurs **de base**, sans bonus. Effective = base + bonus de classe, titres actifs, objets équipés et leurs affixes : ton calcul « stockée + bonus » est le bon, sans double comptage. (enclume 0a0c8d6 ; schéma `perso` et ARCHITECTURE §3.1)
- [x] pwa-ui → architecte : libellés des effets de destinée — champ optionnel `destinee.json > choix[].libelles` (jeton → libellé accentué). La fixture en porte. (enclume 0a0c8d6)
- [x] pwa-ui → architecte : seuil de Maîtrise de forge — niveau L atteint à **25·L·(L−1)** XP cumulée (L2 = 50, L3 = 150, L4 = 300, L5 = 500), sur `forge.json > maitrise_xp`. Le niveau stocké dans `perso.metiers.forge` fait foi. (ARCHITECTURE §3.1)
- [x] pwa-ui → architecte : échelle des jauges — `moral` sur 0-100 ; `population`, `defense` et `renommee` sont des entiers ≥ 0 sans plafond. `defense` est la part hors bâtiments. (ARCHITECTURE §3.1)
- [x] pwa-ui → architecte : sessions — invariant : `journal/sessions/NNN.md` existe pour 1…`partie.session` ; pas d'index. Vérifié par le test de la fixture et, bientôt, par `moteur valider`. (ARCHITECTURE §3.1)
