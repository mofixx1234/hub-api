/**
 * Catalogue public des applications (consultation connectée — tarifs pour futur achat Wave).
 */
const { Application, Ecole } = require('../models');
const { serialiserApplication } = require('../utils/serialisers');

function serialiserEcole(e) {
  return {
    id: e.id,
    nom: e.nom,
    domaine_email: e.domaine_email,
    programme: e.programme,
  };
}

async function listeApplications(req, res, next) {
  try {
    const applications = await Application.findAll({
      where: { deleted_at: null },
      order: [
        ['rubrique', 'ASC'],
        ['nom', 'ASC'],
      ],
    });

    return res.json({
      applications: applications.map(serialiserApplication),
    });
  } catch (err) {
    return next(err);
  }
}

async function listeEcoles(req, res, next) {
  try {
    const ecoles = await Ecole.findAll({
      where: { deleted_at: null },
      order: [['nom', 'ASC']],
    });
    return res.json({ ecoles: ecoles.map(serialiserEcole) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listeApplications, listeEcoles };
