/**
 * Signature des requêtes sortantes Wave et vérification des webhooks (HMAC-SHA256).
 */
const crypto = require('crypto');

/**
 * En-tête Wave-Signature pour appels API (si clé de signature activée sur le portail).
 */
function signerRequete(corpsBrutUtf8) {
  const secret = process.env.WAVE_SIGNING_SECRET;
  if (!secret) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}${corpsBrutUtf8}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Vérifie l’en-tête Wave-Signature du webhook (timestamp + corps brut).
 */
function verifierSignatureWebhook(enteteWaveSignature, corpsBrut, secretWebhook) {
  if (!enteteWaveSignature || !secretWebhook) return false;

  const parties = enteteWaveSignature.split(',').map((p) => p.trim());
  let timestamp = '';
  const signatures = [];

  for (const partie of parties) {
    const eg = partie.indexOf('=');
    if (eg === -1) continue;
    const cle = partie.slice(0, eg);
    const val = partie.slice(eg + 1);
    if (cle === 't') timestamp = val;
    else if (cle.startsWith('v')) signatures.push(val);
  }

  if (!timestamp || signatures.length === 0) return false;

  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return false;
  const maintenant = Math.floor(Date.now() / 1000);
  if (Math.abs(maintenant - ts) > 300) return false;

  const payload = `${timestamp}${corpsBrut}`;
  const calcule = crypto.createHmac('sha256', secretWebhook).update(payload).digest('hex');
  return signatures.includes(calcule);
}

/**
 * Mode simple documenté par Wave : Authorization: Bearer <webhook_secret>
 */
function verifierBearerWebhook(enTeteAuthorization, secretWebhook) {
  if (!enTeteAuthorization || !secretWebhook) return false;
  const prefix = 'Bearer ';
  if (!enTeteAuthorization.startsWith(prefix)) return false;
  const jeton = enTeteAuthorization.slice(prefix.length);
  if (jeton.length !== secretWebhook.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(jeton), Buffer.from(secretWebhook));
  } catch {
    return false;
  }
}

module.exports = {
  signerRequete,
  verifierSignatureWebhook,
  verifierBearerWebhook,
};
