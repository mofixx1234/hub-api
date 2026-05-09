/**
 * Calcul des montants catalogue (FCFA entiers) depuis les UUID d’applications.
 */
const { Op } = require('sequelize');
const { Application } = require('../models');

/** Somme des prix_individuel pour les IDs donnés (applications actives). */
async function totalPourAppsIds(ids) {
  if (!ids?.length) return 0;
  const apps = await Application.findAll({
    where: { id: { [Op.in]: ids }, deleted_at: null },
  });
  let total = 0;
  for (const app of apps) {
    total += Math.round(Number(app.prix_individuel));
  }
  return total;
}

module.exports = { totalPourAppsIds };
