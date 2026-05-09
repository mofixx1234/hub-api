const { AdminMeta } = require('../models');

const CLE_LAST_WAVE_WEBHOOK = 'last_wave_webhook_at';

async function lire(cle) {
  const row = await AdminMeta.findByPk(cle);
  return row?.valeur_json ?? null;
}

async function ecrire(cle, valeurJson) {
  await AdminMeta.upsert({
    cle,
    valeur_json: valeurJson,
    updated_at: new Date(),
  });
}

async function toucherWebhookWave() {
  await ecrire(CLE_LAST_WAVE_WEBHOOK, { at: new Date().toISOString() });
}

async function dernierWebhookWaveAt() {
  const j = await lire(CLE_LAST_WAVE_WEBHOOK);
  return j?.at ? new Date(j.at) : null;
}

module.exports = {
  lire,
  ecrire,
  toucherWebhookWave,
  dernierWebhookWaveAt,
  CLE_LAST_WAVE_WEBHOOK,
};
