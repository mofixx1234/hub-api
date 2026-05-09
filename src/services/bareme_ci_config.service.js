/**
 * Barèmes EPS BAC — programme ivoirien depuis `config_globale.baremes_ci_officiel`.
 * Retombe sur le calcul démo `bareme_eps_ci.js` si clé absente.
 */
const { ConfigGlobale } = require('../models');
const {
  calculerPointsBAC: calculerPointsDemo,
  listeEpreuvesCatalogue,
  EPREUVES,
} = require('./bareme_eps_ci');

const CLE_BAREMES = 'baremes_ci_officiel';
let cache = { valeur: null, expires: 0 };
const TTL_MS = 60_000;

function metaEpreuve(code) {
  return EPREUVES.find((e) => e.code === code);
}

function bracketSexe(sexe) {
  return sexe === 'F' ? 'fille' : 'garcon';
}

/**
 * Paires [performance, points] — interpolation linéaire.
 * @param {number} valeur
 * @param {Array<[number, number]>} echelles triées par performance croissante
 * @param {boolean} plusPetitEstMieux
 */
function interpoler(valeur, echelles, plusPetitEstMieux) {
  if (!Array.isArray(echelles) || echelles.length === 0) return null;
  const v = Number(valeur);
  if (Number.isNaN(v)) return 0;

  const pairs = echelles
    .map((row) => {
      if (Array.isArray(row) && row.length >= 2) return [Number(row[0]), Number(row[1])];
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);

  if (pairs.length === 0) return null;

  if (plusPetitEstMieux) {
    const best = pairs[0][0];
    const worst = pairs[pairs.length - 1][0];
    if (v <= best) return Math.max(0, Math.min(20, pairs[0][1]));
    if (v >= worst) return Math.max(0, Math.min(20, pairs[pairs.length - 1][1]));
    for (let i = 0; i < pairs.length - 1; i += 1) {
      const [x0, y0] = pairs[i];
      const [x1, y1] = pairs[i + 1];
      if (v >= x0 && v <= x1) {
        const t = x1 === x0 ? 0 : (v - x0) / (x1 - x0);
        const pts = y0 + t * (y1 - y0);
        return Math.max(0, Math.min(20, Math.round(pts * 10) / 10));
      }
    }
  } else {
    const best = pairs[pairs.length - 1][0];
    const worst = pairs[0][0];
    if (v >= best) return Math.max(0, Math.min(20, pairs[pairs.length - 1][1]));
    if (v <= worst) return Math.max(0, Math.min(20, pairs[0][1]));
    for (let i = 0; i < pairs.length - 1; i += 1) {
      const [x0, y0] = pairs[i];
      const [x1, y1] = pairs[i + 1];
      if (v >= x0 && v <= x1) {
        const t = x1 === x0 ? 0 : (v - x0) / (x1 - x0);
        const pts = y0 + t * (y1 - y0);
        return Math.max(0, Math.min(20, Math.round(pts * 10) / 10));
      }
    }
  }
  return Math.max(0, Math.min(20, pairs[0][1]));
}

async function chargerBaremesCiBrut() {
  const now = Date.now();
  if (cache.valeur && cache.expires > now) return cache.valeur;

  const row = await ConfigGlobale.findOne({ where: { cle: CLE_BAREMES } });
  const valeur = row?.valeur && typeof row.valeur === 'object' ? row.valeur : null;
  cache = { valeur, expires: now + TTL_MS };
  return valeur;
}

function invaliderCacheBaremesCi() {
  cache = { valeur: null, expires: 0 };
}

async function calculerPointsBacCi(codeEpreuve, valeurBrute, sexe) {
  const meta = metaEpreuve(codeEpreuve);
  const plusPetitEstMieux = meta ? meta.plusPetitEstMieux : true;

  const json = await chargerBaremesCiBrut();
  const branche = bracketSexe(sexe);
  const echelles =
    json?.[branche]?.[codeEpreuve] ||
    json?.garcon?.[codeEpreuve] ||
    json?.fille?.[codeEpreuve];

  if (Array.isArray(echelles) && echelles.length > 0) {
    const pts = interpoler(valeurBrute, echelles, plusPetitEstMieux);
    if (pts !== null && !Number.isNaN(pts)) return pts;
  }

  return calculerPointsDemo(codeEpreuve, valeurBrute);
}

module.exports = {
  CLE_BAREMES,
  chargerBaremesCiBrut,
  calculerPointsBacCi,
  invaliderCacheBaremesCi,
  listeEpreuvesCatalogue,
  interpoler,
};
