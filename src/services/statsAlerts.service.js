/**
 * Vérifications quotidiennes (cron 8h) — alertes e-mail admin central.
 */
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Abonnement, Utilisateur } = require('../models');
const statsService = require('./statsService');
const adminMeta = require('./adminMeta.service');
const { envoyerAlerteAdmin } = require('./email');

async function destinataireAlerteAdmin() {
  const fixe = process.env.ADMIN_ALERT_EMAIL?.trim();
  if (fixe) return fixe;
  const admin = await Utilisateur.findOne({
    where: { type_utilisateur: 'admin_central', deleted_at: null },
    attributes: ['email'],
  });
  return admin?.email || null;
}

async function envoyerSi(destinataire, sujet, texte) {
  if (!destinataire) {
    // eslint-disable-next-line no-console
    console.warn('[statsAlerts] Aucun destinataire (ADMIN_ALERT_EMAIL ou compte admin_central).');
    return;
  }
  await envoyerAlerteAdmin({ destinataire, sujet, texte });
}

async function executerVerifications() {
  const dest = await destinataireAlerteAdmin();

  const dans7 = new Date();
  dans7.setDate(dans7.getDate() + 7);
  const maintenant = new Date();

  const expirant = await Abonnement.findAll({
    where: {
      statut: 'actif',
      deleted_at: null,
      date_fin: { [Op.between]: [maintenant, dans7] },
    },
    attributes: ['id', 'rubrique', 'date_fin', 'utilisateur_id'],
    limit: 500,
  });

  if (expirant.length > 0) {
    const lignes = expirant
      .map((a) => `- ${a.rubrique} · fin ${new Date(a.date_fin).toLocaleDateString('fr-FR')} · ${a.id}`)
      .join('\n');
    await envoyerSi(
      dest,
      '[Hub] Abonnements expirant dans 7 jours',
      `${expirant.length} abonnement(s) concerné(s) :\n\n${lignes}`
    );
  }

  const fin7 = new Date();
  const debut7 = new Date();
  debut7.setDate(debut7.getDate() - 7);
  fin7.setDate(fin7.getDate() - 7);
  const debut14 = new Date();
  debut14.setDate(debut14.getDate() - 14);

  const churnRecent = await Abonnement.count({
    where: {
      statut: 'expire',
      deleted_at: null,
      date_fin: { [Op.between]: [debut7, maintenant] },
    },
  });

  const churnPrev = await Abonnement.count({
    where: {
      statut: 'expire',
      deleted_at: null,
      date_fin: { [Op.between]: [debut14, debut7] },
    },
  });

  if (churnPrev > 0 && churnRecent > churnPrev * 1.2) {
    await envoyerSi(
      dest,
      '[Hub] Alerte churn',
      `Les expirations (${churnRecent}) ont augmenté de plus de 20 % vs la semaine précédente (${churnPrev}).`
    );
  }

  const revJour = await statsService.revenueCeJour();
  if (Number(revJour) === 0) {
    await envoyerSi(
      dest,
      '[Hub] Revenue journalier nul',
      'Aucun paiement enregistré aujourd’hui (succès Wave). Vérifiez les sessions de paiement.'
    );
  }

  if (process.env.WAVE_WEBHOOK_SECRET) {
    const dernierWave = await adminMeta.dernierWebhookWaveAt();
    const ilYA2h = Date.now() - 2 * 60 * 60 * 1000;
    if (!dernierWave || dernierWave.getTime() < ilYA2h) {
      await envoyerSi(
        dest,
        '[Hub] Webhooks Wave silencieux',
        `Aucun webhook Wave enregistré récemment (dernier : ${
          dernierWave ? dernierWave.toISOString() : 'jamais'
        }). Vérifiez la configuration Wave et la charge réseau.`
      );
    }
  }
}

function demarrerPlanificateurAlertes() {
  cron.schedule(
    '0 8 * * *',
    () => {
      executerVerifications().catch((err) =>
        // eslint-disable-next-line no-console
        console.error('[statsAlerts]', err)
      );
    },
    { timezone: process.env.TZ || 'Africa/Abidjan' }
  );
  // eslint-disable-next-line no-console
  console.info('[statsAlerts] Planificateur quotidien (8h) activé.');
}

module.exports = { demarrerPlanificateurAlertes, executerVerifications };
