/**
 * Abonnement actif — Évaluation classe EPS : CI ou JV (catalogue).
 */
const { Op } = require('sequelize');
const { Abonnement } = require('../models');
const {
  EPS_CLASSE_CI,
  EPS_CLASSE_JV,
  EPS_CLASSE_FR_LIBRE,
} = require('../constants/applications');

async function exigerAbonnementEvalClasse(req, res, next) {
  try {
    const idsApps = [EPS_CLASSE_CI, EPS_CLASSE_JV, EPS_CLASSE_FR_LIBRE];

    const abs = await Abonnement.findAll({
      where: {
        utilisateur_id: req.utilisateur.id,
        statut: 'actif',
        deleted_at: null,
        date_fin: { [Op.gt]: new Date() },
      },
    });

    const ok = abs.some((a) => {
      const liste = Array.isArray(a.apps_incluses) ? a.apps_incluses : [];
      return liste.some((id) => idsApps.some((ref) => String(ref) === String(id)));
    });

    if (!ok) {
      return res.status(403).json({
        erreur:
          'Abonnement requis : évaluation classe (ivoirien, Jules Verne ou candidat libre).',
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

/** Alias pour montage dans app.js (même logique : apps évaluation classe CI / JV / FR libre). */
const verifierAbonnementEvalClasse = exigerAbonnementEvalClasse;

module.exports = {
  exigerAbonnementEvalClasse,
  verifierAbonnementEvalClasse,
};
