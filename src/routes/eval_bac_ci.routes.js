/**
 * Évaluation BAC CI — consultation barèmes officiels (config BDD).
 */
const express = require('express');
const { exigerAbonnementPourApp } = require('../middleware/abonnement-app.middleware');
const { EPS_BAC_CI } = require('../constants/applications');
const ctrl = require('../controllers/eval_bac_ci.controller');

const router = express.Router();

router.get('/baremes-officiels', exigerAbonnementPourApp(EPS_BAC_CI), ctrl.baremesOfficiels);

module.exports = router;
