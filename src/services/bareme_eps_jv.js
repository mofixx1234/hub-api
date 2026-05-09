/**
 * Barème EPS démo — programme français (Jules Verne). Même logique que CI, libellés FR.
 */
const EPREUVES = [
  { code: 'course_50m_sec', label: 'Course 50 m (secondes)', unite: 's', plusPetitEstMieux: true },
  { code: 'course_100m_sec', label: 'Course 100 m (secondes)', unite: 's', plusPetitEstMieux: true },
  { code: 'saut_longueur_m', label: 'Saut en longueur (m)', unite: 'm', plusPetitEstMieux: false },
  { code: 'lancer_poids_m', label: 'Lancer du poids (m)', unite: 'm', plusPetitEstMieux: false },
];

const { calculerPointsBAC } = require('./bareme_eps_ci');

function listeEpreuvesCatalogue() {
  return EPREUVES;
}

module.exports = { calculerPointsBAC, listeEpreuvesCatalogue, EPREUVES };
