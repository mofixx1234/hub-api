/**
 * Vérifications au démarrage — avertissements en production.
 */

function validerEnvironnement() {
  const prod = process.env.NODE_ENV === 'production';
  const jwt = process.env.JWT_SECRET || '';

  if (prod && (!jwt || jwt.length < 32 || /changez_moi/i.test(jwt))) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Hub] Production : définissez JWT_SECRET (≥32 caractères aléatoires) dans les variables d’environnement.'
    );
  }

  if (prod && !process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.error('[Hub] DATABASE_URL est requis.');
  }

  if (prod && !process.env.WAVE_WEBHOOK_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('[Hub] WAVE_WEBHOOK_SECRET absent — configurez Wave avant acceptation des paiements.');
  }

  if (prod && process.env.FRONTEND_URL?.includes('localhost')) {
    // eslint-disable-next-line no-console
    console.warn('[Hub] FRONTEND_URL pointe encore vers localhost en production.');
  }
}

module.exports = { validerEnvironnement };
