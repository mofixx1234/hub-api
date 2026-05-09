/**
 * Analytics — périmètres admin central, école, personnel.
 */
const statsService = require('../services/statsService');
const activityLog = require('../services/activityLog.service');

async function adminDashboard(req, res, next) {
  try {
    const kpis = await statsService.kpisAdminDashboard();
    const [
      revenue_journalier_30j,
      abonnements_par_rubrique,
      utilisateurs_par_semaine,
      apps_usage,
    ] = await Promise.all([
      statsService.revenueParJour30(),
      statsService.abonnementsActifsParRubrique(),
      statsService.croissanceUtilisateurs8Semaines(),
      statsService.utilisationAppsGlobale({ limit: 15 }),
    ]);

    return res.json({
      kpis,
      graphiques: {
        revenue_journalier_30j,
        abonnements_par_rubrique,
        utilisateurs_par_semaine,
        apps_usage,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function adminRevenue(req, res, next) {
  try {
    const [kpis, serie] = await Promise.all([
      statsService.kpisAdminDashboard(),
      statsService.revenueParJour30(),
    ]);
    return res.json({
      revenue_mois_fcfa: kpis.revenue_mois_fcfa,
      revenue_jour_fcfa: kpis.revenue_jour_fcfa,
      serie_journaliere_30j: serie,
    });
  } catch (err) {
    return next(err);
  }
}

async function adminUtilisateurs(req, res, next) {
  try {
    const croissance = await statsService.croissanceUtilisateurs8Semaines();
    const nouveaux = await statsService.nouveauxUtilisateursCetteSemaine();
    const churnData = await statsService.metriquesChurnEtRenouvellement30j();
    return res.json({
      nouveaux_utilisateurs_7j: nouveaux,
      churn_pct_30j: churnData.churn_pct,
      renewal_pct_30j: churnData.renewal_pct,
      utilisateurs_par_semaine: croissance,
    });
  } catch (err) {
    return next(err);
  }
}

async function adminAbonnements(req, res, next) {
  try {
    const kpis = await statsService.kpisAdminDashboard();
    return res.json({
      abonnements_actifs_par_rubrique: kpis.abonnements_actifs_par_rubrique,
      churn_pct_30j: kpis.churn_pct_30j,
      renewal_pct_30j: kpis.renewal_pct_30j,
    });
  } catch (err) {
    return next(err);
  }
}

async function adminApps(req, res, next) {
  try {
    const apps_usage = await statsService.utilisationAppsGlobale({ limit: 20 });
    return res.json({ apps_usage });
  } catch (err) {
    return next(err);
  }
}

async function ecoleDashboard(req, res, next) {
  try {
    if (!req.utilisateur.ecole_id) {
      return res.status(403).json({ erreur: 'Compte non rattaché à une école.' });
    }
    const data = await statsService.statsEcole(req.utilisateur.ecole_id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function perso(req, res, next) {
  try {
    const data = await statsService.statsPerso(req.utilisateur.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function logExport(req, res, next) {
  try {
    const format = req.body?.format || 'pdf';
    await activityLog.enregistrer({
      userId: req.utilisateur.id,
      action: 'export',
      appName: req.body?.app_name || 'hub',
      metadata: { format },
    });
    return res.json({ message: 'Export journalisé.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  adminDashboard,
  adminRevenue,
  adminUtilisateurs,
  adminAbonnements,
  adminApps,
  ecoleDashboard,
  perso,
  logExport,
};
