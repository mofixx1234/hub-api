/**
 * Jetons JWT — payload minimal : souscripteur (utilisateur) + identifiant de session.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

function signerJeton(utilisateurId, sessionId) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET manquant dans .env');
  }
  return jwt.sign(
    {
      sub: utilisateurId,
      sid: sessionId,
      typ: 'access',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifierJeton(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET manquant dans .env');
  }
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signerJeton, verifierJeton, JWT_EXPIRES_IN };
