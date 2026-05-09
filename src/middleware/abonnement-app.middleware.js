/**
 * Vérifie qu’au moins un abonnement actif inclut l’application (UUID catalogue).
 */
const { Op } = require('sequelize');
const { Abonnement } = require('../models');

function exigerAbonnementPourApp(applicationId) {
  return async function abonnementAppMiddleware(req, res, next) {
    try {
      const abs = await Abonnement.findAll({
        where: {
          utilisateur_id: req.utilisateur.id,
          statut: 'actif',
          deleted_at: null,
          date_fin: { [Op.gt]: new Date() },
        },
      });

      const correspond = abs.filter((a) => {
        const liste = Array.isArray(a.apps_incluses) ? a.apps_incluses : [];
        return liste.some((id) => String(id) === String(applicationId));
      });

      if (correspond.length === 0) {
        return res.status(403).json({
          erreur: 'Aucun abonnement actif ne couvre cette application.',
        });
      }

      req.abonnementsPourApp = correspond;
      req.abonnementPrincipalPourApp = correspond[0];
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { exigerAbonnementPourApp };
