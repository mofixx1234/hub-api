/**
 * POST /api/webhooks/wave — corps brut JSON + authentification Wave.
 */
const {
  verifierSignatureWebhook,
  verifierBearerWebhook,
} = require('../services/wave.signature');
const {
  traiterCheckoutComplete,
  traiterCheckoutEchec,
} = require('../services/wave.webhook.service');
const adminMeta = require('../services/adminMeta.service');

async function webhookWave(req, res, next) {
  try {
    const corpsBrut = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : String(req.body ?? '');

    const secret = process.env.WAVE_WEBHOOK_SECRET;
    if (!secret) {
      // eslint-disable-next-line no-console
      console.error('[Wave] WAVE_WEBHOOK_SECRET non configuré — webhook refusé.');
      return res.status(503).json({ erreur: 'Webhooks Wave non configurés.' });
    }

    const auth = req.get('authorization') || '';
    const waveSig = req.get('wave-signature') || '';

    let autorise = false;
    if (auth && verifierBearerWebhook(auth, secret)) {
      autorise = true;
    } else if (waveSig && verifierSignatureWebhook(waveSig, corpsBrut, secret)) {
      autorise = true;
    }

    if (!autorise) {
      return res.status(401).json({ erreur: 'Authentification webhook invalide.' });
    }

    await adminMeta.toucherWebhookWave();

    let payload;
    try {
      payload = JSON.parse(corpsBrut);
    } catch {
      return res.status(400).send('Invalid JSON');
    }

    const type = payload.type;
    const data = payload.data || {};

    if (type === 'checkout.session.completed') {
      const r = await traiterCheckoutComplete(data);
      if (r.erreur) {
        // eslint-disable-next-line no-console
        console.error('[Wave] Anomalie métier (accusé pour éviter boucle retry) :', r.message);
      }
      return res.status(200).send('OK');
    }

    if (type === 'checkout.session.payment_failed') {
      await traiterCheckoutEchec(data);
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');
  } catch (err) {
    return next(err);
  }
}

module.exports = { webhookWave };
