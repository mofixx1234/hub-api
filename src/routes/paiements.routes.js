/**
 * Routes paiements Wave (utilisateur authentifié).
 */
const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const paiements = require('../controllers/paiements.controller');

const router = express.Router();

router.post('/wave/session', exigerAuthentification, paiements.creerSessionWave);
router.post(
  '/wave/session-collectif',
  exigerAuthentification,
  paiements.creerSessionCollectifWave
);

module.exports = router;
