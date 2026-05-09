/**
 * Vérifie qu’un abonnement actif et non expiré existe pour la rubrique demandée.
 * À placer après `exigerAuthentification` (req.utilisateur requis).
 */
const { Op } = require('sequelize');
const { Abonnement } = require('../models');

function verifierAbonnement(rubriqueRequise) {
  return async function verifierAbonnementMiddleware(req, res, next) {
    try {
      if (!req.utilisateur) {
        return res.status(401).json({ erreur: 'Non authentifié.' });
      }

      const maintenant = new Date();
      const abonnement = await Abonnement.findOne({
        where: {
          utilisateur_id: req.utilisateur.id,
          rubrique: rubriqueRequise,
          statut: 'actif',
          date_fin: { [Op.gte]: maintenant },
          deleted_at: null,
        },
      });

      if (!abonnement) {
        return res.status(403).json({
          erreur: 'Abonnement requis.',
          code: 'ABONNEMENT_REQUIS',
          rubrique: rubriqueRequise,
        });
      }

      req.abonnement = abonnement;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { verifierAbonnement };
