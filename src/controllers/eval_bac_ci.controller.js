/**
 * Métadonnées barèmes BAC — programme ivoirien (lecture config globale).
 */
const { CLE_BAREMES, chargerBaremesCiBrut } = require('../services/bareme_ci_config.service');

async function baremesOfficiels(req, res, next) {
  try {
    const valeur = await chargerBaremesCiBrut();
    return res.json({
      cle: CLE_BAREMES,
      baremes: valeur,
      rappel:
        'Les points calculés pour une note déjà enregistrée ne changent pas si le barème est modifié ensuite.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { baremesOfficiels };
