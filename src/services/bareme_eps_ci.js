/**
 * Calcul des points BAC EPS — barème démo (à remplacer par JSON officiel CI / école).
 * Les codes d’épreuve sont des identifiants stables côté API.
 */

const EPREUVES = [
  { code: 'course_50m_sec', label: 'Course 50 m (s)', unite: 's', plusPetitEstMieux: true },
  { code: 'course_100m_sec', label: 'Course 100 m (s)', unite: 's', plusPetitEstMieux: true },
  { code: 'saut_longueur_m', label: 'Saut en longueur (m)', unite: 'm', plusPetitEstMieux: false },
  { code: 'lancer_poids_m', label: 'Lancer du poids (m)', unite: 'm', plusPetitEstMieux: false },
];

/**
 * Points sur 20 — interpolation très simplifiée pour démo.
 */
function calculerPointsBAC(codeEpreuve, valeurBrute) {
  const v = Number(valeurBrute);
  if (Number.isNaN(v)) return 0;

  switch (codeEpreuve) {
    case 'course_50m_sec':
      return Math.max(0, Math.min(20, Math.round((18 - v) * 2)));
    case 'course_100m_sec':
      return Math.max(0, Math.min(20, Math.round((28 - v) * 1.2)));
    case 'saut_longueur_m':
      return Math.max(0, Math.min(20, Math.round(v * 8)));
    case 'lancer_poids_m':
      return Math.max(0, Math.min(20, Math.round(v * 5)));
    default:
      return Math.max(0, Math.min(20, v));
  }
}

function listeEpreuvesCatalogue() {
  return EPREUVES;
}

module.exports = { calculerPointsBAC, listeEpreuvesCatalogue, EPREUVES };
