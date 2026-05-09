/**
 * Gestionnaire d'erreurs Express — ne fuite pas les détails en production.
 */

function gestionnaireErreur(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('[erreur]', err.message, err.stack);

  const statut = err.status || err.statusCode || 500;
  const corps =
    process.env.NODE_ENV === 'development'
      ? { erreur: err.message || 'Erreur serveur', detail: String(err) }
      : { erreur: statut === 500 ? 'Erreur serveur.' : err.message };

  if (res.headersSent) {
    return next(err);
  }
  return res.status(statut >= 400 && statut < 600 ? statut : 500).json(corps);
}

function routeIntrouvable(req, res) {
  res.status(404).json({ erreur: 'Route introuvable.' });
}

module.exports = { gestionnaireErreur, routeIntrouvable };
