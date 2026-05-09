/**
 * Données réservées au personnel de l’école (admin EPS).
 */
const { Utilisateur } = require('../models');

async function listeProfesseurs(req, res, next) {
  try {
    const admin = req.utilisateur;
    if (!admin.ecole_id) {
      return res.status(403).json({ erreur: 'Compte sans rattachement école.' });
    }

    const profs = await Utilisateur.findAll({
      where: {
        ecole_id: admin.ecole_id,
        type_utilisateur: 'prof_eps',
        deleted_at: null,
      },
      attributes: ['id', 'email', 'prenom', 'nom', 'created_at'],
      order: [['nom', 'ASC']],
    });

    return res.json({ professeurs: profs });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listeProfesseurs };
