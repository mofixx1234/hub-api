/**
 * Purge quotidienne (3 h) — éléments en corbeille (soft-delete) depuis plus de 30 jours,
 * puis comptes utilisateurs marqués supprimés depuis plus de 30 jours.
 */
const cron = require('node-cron');
const { Op } = require('sequelize');
const { EpsEleve, Joueur, Match, Utilisateur } = require('../models');

const PURGE_JOURS = 30;

function seuilPurge() {
  const d = new Date();
  d.setDate(d.getDate() - PURGE_JOURS);
  return d;
}

async function executerPurgeProfil() {
  const seuil = seuilPurge();
  const whereAncien = { deleted_at: { [Op.lt]: seuil } };

  const r1 = await EpsEleve.destroy({ where: whereAncien });
  const r2 = await Joueur.destroy({ where: whereAncien });
  const r3 = await Match.destroy({ where: whereAncien });
  const r4 = await Utilisateur.destroy({ where: whereAncien });

  // eslint-disable-next-line no-console
  console.info(
    `[profilPurge] ${new Date().toISOString()} — eps_eleves:${r1} joueurs:${r2} matchs:${r3} utilisateurs:${r4}`
  );
}

function demarrerPlanificateurPurgeProfil() {
  cron.schedule('0 3 * * *', () => {
    executerPurgeProfil().catch((e) =>
      // eslint-disable-next-line no-console
      console.error('[profilPurge]', e.message)
    );
  });
  // eslint-disable-next-line no-console
  console.info('[profilPurge] Planificateur actif (tous les jours à 3 h).');
}

module.exports = {
  demarrerPlanificateurPurgeProfil,
  executerPurgeProfil,
  PURGE_JOURS,
};
