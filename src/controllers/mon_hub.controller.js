/**
 * Hub utilisateur : abonnements avec applications résolues (RBAC : propriétaire uniquement).
 */
const { Op } = require('sequelize');
const { Application, Abonnement, Ecole } = require('../models');
const { serialiserApplication } = require('../utils/serialisers');

async function listeAbonnements(req, res, next) {
  try {
    const lignes = await Abonnement.findAll({
      where: {
        utilisateur_id: req.utilisateur.id,
        deleted_at: null,
      },
      include: [{ model: Ecole, as: 'ecole', required: false }],
      order: [['date_fin', 'ASC']],
    });

    const abonnements = [];

    for (const ab of lignes) {
      const idsBruts = Array.isArray(ab.apps_incluses) ? ab.apps_incluses : [];
      const ids = idsBruts.filter((id) => typeof id === 'string');

      let applications = [];
      if (ids.length > 0) {
        applications = await Application.findAll({
          where: {
            id: { [Op.in]: ids },
            deleted_at: null,
          },
        });
        const ordre = new Map(ids.map((id, index) => [id, index]));
        applications.sort((a, b) => (ordre.get(a.id) ?? 0) - (ordre.get(b.id) ?? 0));
      }

      const ecole =
        ab.ecole && !ab.ecole.deleted_at ? ab.ecole : null;
      abonnements.push({
        id: ab.id,
        rubrique: ab.rubrique,
        type_abonnement: ab.type_abonnement,
        sport: ab.sport,
        programme: ab.programme,
        statut: ab.statut,
        date_debut: ab.date_debut,
        date_fin: ab.date_fin,
        montant_paye: Number(ab.montant_paye),
        apps_incluses_ids: ids,
        ecole: ecole
          ? {
              id: ecole.id,
              nom: ecole.nom,
              domaine_email: ecole.domaine_email,
              programme: ecole.programme,
            }
          : null,
        applications: applications.map(serialiserApplication),
      });
    }

    return res.json({ abonnements });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listeAbonnements };
