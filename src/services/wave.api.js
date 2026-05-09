/**
 * Appels HTTP vers l’API Wave Checkout (sessions).
 */
const https = require('https');
const { signerRequete } = require('./wave.signature');

const BASE_DEFAUT = 'https://api.wave.com';

function baseUrl() {
  return (process.env.WAVE_API_BASE_URL || BASE_DEFAUT).replace(/\/$/, '');
}

/**
 * Crée une session checkout Wave. Retourne le JSON Wave (wave_launch_url, id, …).
 */
async function creerSessionCheckout(corpsObjet) {
  const apiKey = process.env.WAVE_API_KEY;
  if (!apiKey) {
    throw new Error('WAVE_API_KEY manquant dans .env');
  }

  const corpsBrut = JSON.stringify(corpsObjet);
  const url = new URL(`${baseUrl()}/v1/checkout/sessions`);

  const entetes = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(corpsBrut),
  };

  const sig = signerRequete(corpsBrut);
  if (sig) {
    entetes['Wave-Signature'] = sig;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: entetes,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              const err = new Error(json.message || json.error || `Wave HTTP ${res.statusCode}`);
              err.statusCode = res.statusCode;
              err.body = json;
              reject(err);
            }
          } catch (e) {
            reject(new Error(`Réponse Wave non JSON : ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(corpsBrut);
    req.end();
  });
}

module.exports = { creerSessionCheckout, baseUrl };
