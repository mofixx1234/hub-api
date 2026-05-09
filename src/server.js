/**
 * Point d'entrée HTTP — charge les variables d'environnement avant app.
 */
require('dotenv').config();

const { validerEnvironnement } = require('./config/validate-env');
validerEnvironnement();

const app = require('./app');
const { demarrerPlanificateurAlertes } = require('./services/statsAlerts.service');
const { demarrerPlanificateurPurgeProfil } = require('./services/profilPurge.service');

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Hub API écoute sur le port ${port}`);
  try {
    demarrerPlanificateurAlertes();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[statsAlerts] Démarrage impossible :', e.message);
  }
  try {
    demarrerPlanificateurPurgeProfil();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[profilPurge] Démarrage impossible :', e.message);
  }
});
