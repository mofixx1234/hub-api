/**
 * RBAC minimal — limite aux types utilisateur autorisés.
 */
function exigerTypes(...typesAutorises) {
  return function exigerTypesMiddleware(req, res, next) {
    if (!req.utilisateur) {
      return res.status(401).json({ erreur: 'Authentification requise.' });
    }
    if (!typesAutorises.includes(req.utilisateur.type_utilisateur)) {
      return res.status(403).json({ erreur: 'Accès réservé à certains profils.' });
    }
    return next();
  };
}

module.exports = { exigerTypes };
