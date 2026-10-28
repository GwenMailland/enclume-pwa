// Règles dérivées — réplique des formules du GDD §3.1, §3.2, §3.4 et §3.5.
// ⚠️ À GARDER SYNCHRONISÉ AVEC LE MOTEUR (repo enclume, moteur/) : toute
// modification des formules côté moteur doit être reportée ici.

export const STATS = ["FOR", "AGI", "END", "INT", "DEX", "VOL", "CHA"];

// Modificateur = floor(stat / 5) - 1 (8 → +0, 15 → +2, 50 → +9, 100 → +19)
export function modificateur(stat) {
  return Math.floor(stat / 5) - 1;
}

export function pvMax(end, niveau) {
  return 20 + end * 3 + niveau * 5;
}

export function pmMax(int, vol) {
  return 10 + int * 2 + vol;
}

export function enduranceMax(end) {
  return 5 + Math.floor(end / 4);
}

export function defense(agi, armure = 0) {
  return 10 + modificateur(agi) + armure;
}

export function initiative(agi, dex) {
  return modificateur(agi) + modificateur(dex);
}

export function chargeMax(force) {
  return force * 3;
}

// XP pour passer du niveau n à n+1
export function seuilXp(niveau) {
  return Math.round(100 * Math.pow(niveau, 1.5));
}

// Le compteur d'usage d'une stat la fait monter de +1 quand il atteint 10 + valeur
export function seuilUsage(valeurStat) {
  return 10 + valeurStat;
}

export function signe(n) {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

// Bonus de stats venant de la classe, des titres actifs et de l'équipement porté.
export function bonusStats(perso, inventaire) {
  const bonus = Object.fromEntries(STATS.map((s) => [s, 0]));
  const ajouter = (b) => {
    if (!b) return;
    for (const [k, v] of Object.entries(b)) if (k in bonus && typeof v === "number") bonus[k] += v;
  };
  ajouter(perso?.classe?.bonus);
  const actifs = new Set(perso?.titres?.actifs ?? []);
  for (const t of perso?.titres?.obtenus ?? []) if (actifs.has(t.id)) ajouter(t.bonus);
  for (const o of objetsEquipes(inventaire)) {
    ajouter(o.bonus);
    for (const a of o.affixes ?? []) ajouter(a.bonus);
  }
  return bonus;
}

export function objetsEquipes(inventaire) {
  if (!inventaire) return [];
  const parId = new Map((inventaire.objets ?? []).map((o) => [o.id, o]));
  const ids = new Set(Object.values(inventaire.equipement ?? {}).filter(Boolean));
  return [...ids].map((id) => parId.get(id)).filter(Boolean);
}

export function armure(inventaire) {
  return objetsEquipes(inventaire).reduce((s, o) => s + (o.defense ?? 0), 0);
}

export function poidsPorte(inventaire) {
  return (inventaire?.objets ?? []).reduce((s, o) => s + (o.poids_kg ?? 0) * (o.quantite ?? 1), 0);
}

// Toutes les dérivées, à partir des stats effectives (base + bonus).
export function derivees(perso, inventaire) {
  const b = bonusStats(perso, inventaire);
  const eff = Object.fromEntries(STATS.map((s) => [s, (perso?.stats?.[s] ?? 0) + b[s]]));
  const niveau = perso?.niveau ?? 1;
  return {
    effectives: eff,
    bonus: b,
    pvMax: pvMax(eff.END, niveau),
    pmMax: pmMax(eff.INT, eff.VOL),
    enduranceMax: enduranceMax(eff.END),
    armure: armure(inventaire),
    defense: defense(eff.AGI, armure(inventaire)),
    initiative: initiative(eff.AGI, eff.DEX),
    chargeMax: chargeMax(eff.FOR),
    poids: poidsPorte(inventaire),
    seuilXp: seuilXp(niveau),
  };
}

export const DEGRES_REUSSIS = new Set(["critique", "eclatant", "succes", "succes_cout"]);

export function bilanJets(jets) {
  const avecDegre = jets.filter((j) => j.degre);
  const reussis = avecDegre.filter((j) => DEGRES_REUSSIS.has(j.degre)).length;
  return {
    total: jets.length,
    evalues: avecDegre.length,
    reussis,
    taux: avecDegre.length ? Math.round((reussis / avecDegre.length) * 100) : null,
    critiques: avecDegre.filter((j) => j.degre === "critique").length,
    fiascos: avecDegre.filter((j) => j.degre === "fiasco").length,
  };
}
