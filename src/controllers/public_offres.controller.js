/**
 * Données publiques — comparaison des offres (sans authentification).
 */
const { Application } = require('../models');

function somme(arr) {
  return Math.round(arr.reduce((s, a) => s + Number(a.prix_individuel || 0), 0));
}

async function comparaisonOffres(req, res, next) {
  try {
    const apps = await Application.findAll({
      where: { deleted_at: null },
    });

    const sport = apps.filter((a) => a.rubrique === 'SPORT');
    const ci = apps.filter((a) => a.rubrique === 'ENSEIGNEMENT_CI');
    const frTous = apps.filter((a) => a.rubrique === 'ENSEIGNEMENT_FR');
    const frLibre = frTous.filter((a) => !a.specifique_ecole);
    const frEcole = frTous.filter((a) => a.specifique_ecole);

    return res.json({
      prix_formule_sport_fcfa: somme(sport),
      prix_formule_enseignement_ci_fcfa: somme(ci),
      prix_formule_fr_candidat_libre_fcfa: somme(frLibre),
      prix_formule_fr_ecole_homologuee_fcfa: somme(frEcole),
      detail: {
        nb_apps_sport: sport.length,
        nb_apps_ci: ci.length,
        nb_apps_fr_libre: frLibre.length,
        nb_apps_fr_ecole: frEcole.length,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { comparaisonOffres };
