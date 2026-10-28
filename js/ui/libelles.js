// Traduction des énumérations ASCII du contrat (schemas/) pour l'affichage.

const TABLES = {
  qualite: { Ordinaire: "Ordinaire", Fine: "Fine", Rare: "Rare", Epique: "Épique", Unique: "Unique", Legendaire: "Légendaire", Ratee: "Ratée" },
  rang_classe: { Commune: "Commune", Avancee: "Avancée", Rare: "Rare", Heroique: "Héroïque", Legendaire: "Légendaire", Mythique: "Mythique" },
  saison: { printemps: "printemps", ete: "été", automne: "automne", hiver: "hiver" },
  moment: { aube: "aube", matin: "matin", midi: "midi", apres_midi: "après-midi", crepuscule: "crépuscule", nuit: "nuit" },
  degre: { critique: "Critique", eclatant: "Éclatant", succes: "Succès", succes_cout: "Succès à coût", echec: "Échec", fiasco: "Fiasco" },
  palier_ville: { campement: "Campement", hameau: "Hameau", village: "Village", bourg: "Bourg", ville: "Ville", cite: "Cité" },
  ressource_ville: { bois: "Bois", pierre: "Pierre", minerai: "Minerai", vivres: "Vivres", or: "Or", cristaux: "Cristaux" },
  type_objet: { arme: "Arme", armure: "Armure", bouclier: "Bouclier", accessoire: "Accessoire", outil: "Outil", consommable: "Consommable", quete: "Quête", divers: "Divers" },
  emplacement: {
    arme_principale: "Arme principale",
    arme_secondaire: "Arme secondaire",
    tete: "Tête",
    torse: "Torse",
    mains: "Mains",
    jambes: "Jambes",
    pieds: "Pieds",
    amulette: "Amulette",
    anneau_1: "Anneau I",
    anneau_2: "Anneau II",
  },
  statut_pnj: { inconnu: "Inconnu", connaissance: "Connaissance", ami: "Ami", allie: "Allié", rival: "Rival", ennemi: "Ennemi", mentor: "Mentor", amour: "Amour" },
  etat_lieu: { intact: "Intact", endommage: "Endommagé", detruit: "Détruit", controle: "Sous contrôle" },
  type_lieu: { cite: "Cité", port: "Port", hameau: "Hameau", village: "Village", site_breche: "Site de brèche", forge: "Forge", ruine: "Ruine", donjon: "Donjon" },
  type_quete: { principale: "Principale", annexe: "Annexe", ville: "Ville", eveil: "Éveil" },
  statut_quete: { active: "Active", terminee: "Terminée", echouee: "Échouée" },
  type_quete_sys: { urgente: "Urgente", cachee: "Cachée", arc: "Arc" },
  etat_breche: { ouverte: "Ouverte", en_cours: "En cours", fermee: "Fermée", debordee: "Débordée" },
  statut_penalite: { a_venir: "À venir", subie: "Subie", survecue: "Survécue" },
  statut_quotidienne: { en_cours: "En cours", accomplie: "Accomplie", echouee: "Échouée" },
  type_destinee: { serment: "Serment", allegeance: "Allégeance", voie: "Voie", sacrifice: "Sacrifice", pnj_cle: "PNJ clé", nom_ville: "Nom de la ville", autre: "Autre" },
  type_competence: { active: "Active", passive: "Passive", metier: "Métier" },
  source_recette: { origine: "Origine", apprise: "Apprise", decouverte: "Découverte", experimentale: "Expérimentale" },
  type_jet: { jet: "Jet", oppose: "Jet opposé", attaque: "Attaque", degats: "Dégâts", initiative: "Initiative", forge: "Forge", enchantement: "Enchantement" },
  avantage: { aucun: "", avantage: "avantage", desavantage: "désavantage" },
  mode_mort: { permadeath: "Mort définitive", penalite: "Mort avec pénalité" },
  origine: {
    apprenti_forgeron: "Apprenti forgeron",
    mercenaire: "Mercenaire",
    novice_arcanique: "Novice arcanique",
    chasseur: "Chasseur",
    batisseur: "Bâtisseur",
    orphelin_des_rues: "Orphelin des rues",
  },
  type_bestiaire: { bete: "Bête", elementaire: "Élémentaire", humanoide: "Humanoïde", mort_vivant: "Mort-vivant", construct: "Construct", demon: "Démon" },
  type_nom: { pnj: "PNJ", lieu: "Lieu", faction: "Faction", region: "Région", objet: "Objet", ennemi: "Ennemi", ville: "Ville", monde: "Monde", autre: "Autre" },
  metier: { forge: "Maîtrise de forge", enchantement: "Enchantement", batisseur: "Bâtisseur", architecture: "Architecture", commandement: "Commandement", negoce: "Négoce" },
  ton: { heroique_sombre: "Héroïque sombre" },
  ressource: { pv: "PV", pm: "PM", end: "⚡" },
};

// Libellé lisible : table connue, sinon « snake_case » → « Snake case ».
export function libelle(table, valeur) {
  if (valeur === null || valeur === undefined || valeur === "") return "";
  const t = TABLES[table];
  if (t && valeur in t) return t[valeur];
  return humaniser(valeur);
}

export function humaniser(valeur) {
  const s = String(valeur).replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const ICONES_DEGRE = { critique: "💥", eclatant: "🌟", succes: "✅", succes_cout: "⚖️", echec: "❌", fiasco: "💀" };

export const ORDRE_QUALITES = ["Ordinaire", "Fine", "Rare", "Epique", "Unique", "Legendaire"];

export function dateJeu(date) {
  if (!date) return "";
  const parties = [`Jour ${date.jour}`];
  if (date.saison) parties.push(`${libelle("saison", date.saison)}, an ${date.annee ?? 1}`);
  if (date.moment) parties.push(libelle("moment", date.moment));
  return parties.join(" · ");
}

export function heureLocale(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const maintenant = new Date();
  const memeJour = d.toDateString() === maintenant.toDateString();
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (memeJour) return `aujourd'hui ${heure}`;
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} ${heure}`;
}

export function pluriel(n, singulier, plurielForme = `${singulier}s`) {
  return `${n} ${n > 1 ? plurielForme : singulier}`;
}

// Clés de bonus libres (« contre_verre », « sorts »…) → texte.
const BONUS = { degats: "dégâts", initiative: "initiative", sorts: "sorts", forge: "forge", contre_verre: "contre le verre", jets: "jets" };

export function texteBonus(bonus) {
  if (!bonus) return "";
  return Object.entries(bonus)
    .map(([k, v]) => `${v >= 0 ? "+" : "−"}${Math.abs(v)} ${BONUS[k] ?? (k.toUpperCase() === k ? k : humaniser(k).toLowerCase())}`)
    .join(", ");
}

export function chiffresRomains(n) {
  return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ?? String(n);
}
