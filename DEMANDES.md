# Demandes pwa-ui → architecte (repo enclume)

Format : `- [ ] pwa-ui → architecte : <besoin> (raison)`

## Ouvertes

- [ ] pwa-ui → architecte : préciser si `perso.stats` inclut déjà les bonus de classe, de titres actifs et d'équipement (raison : la PWA affiche la valeur stockée et calcule les dérivées sur « stockée + bonus » ; si la valeur stockée est déjà effective, il y a double comptage).
- [ ] pwa-ui → architecte : ajouter un libellé d'affichage aux effets de `destinee.json > choix[].ouvre / verrouille` (ex. `{"cle": "rang:cercle_jure", "libelle": "Rang : Cercle juré"}`) (raison : les slugs ASCII perdent les accents ; la PWA affiche aujourd'hui « Rang : cercle jure »).
- [ ] pwa-ui → architecte : donner le seuil d'XP de Maîtrise de forge (formule GDD ou champ `forge.json > maitrise_seuil`) (raison : afficher une barre de progression comme pour l'XP de niveau).
- [ ] pwa-ui → architecte : préciser l'échelle des jauges `ville.jauges.defense` et `renommee` (0-100 comme le moral ?) (raison : la PWA les affiche sur 100 par défaut).
- [ ] pwa-ui → architecte : lister les sessions (ex. `journal/sessions/index.json`) ou garantir que `NNN.md` existe pour 1…`partie.session` (raison : sans listing, la PWA tente 001 à N et ignore les 404).

## Traitées
