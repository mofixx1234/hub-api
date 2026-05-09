const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const { exigerTypes } = require('../middleware/role.middleware');
const ctrl = require('../controllers/admin_baremes.controller');

const router = express.Router();

router.use(exigerAuthentification);
router.use(exigerTypes('admin_central'));

router.get('/', ctrl.resume);
router.get('/historique', ctrl.historique);
router.put('/ci', ctrl.mettreAJourBaremesCi);
router.put('/ecoles/:ecoleId', ctrl.mettreAJourBaremesEcole);

module.exports = router;
