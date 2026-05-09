/**
 * Journalise un accès applicatif après authentification (à placer après exigerAuthentification).
 */
const activityLog = require('../services/activityLog.service');

function infererAppSport(req) {
  const p = req.path || '';
  if (p.includes('/stats/')) return 'sport_stats';
  return 'gestion_sport';
}

function journaliserAccesSport(req, res, next) {
  if (req.utilisateur?.id) {
    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'app_access',
      appName: infererAppSport(req),
      metadata: { methode: req.method, path: req.originalUrl },
    });
  }
  next();
}

function journaliserAccesEpsCi(req, res, next) {
  if (req.utilisateur?.id) {
    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'app_access',
      appName: 'eps_ci',
      metadata: { methode: req.method, path: req.originalUrl },
    });
  }
  next();
}

function journaliserAccesEpsJv(req, res, next) {
  if (req.utilisateur?.id) {
    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'app_access',
      appName: 'eps_jv',
      metadata: { methode: req.method, path: req.originalUrl },
    });
  }
  next();
}

module.exports = {
  journaliserAccesSport,
  journaliserAccesEpsCi,
  journaliserAccesEpsJv,
};
