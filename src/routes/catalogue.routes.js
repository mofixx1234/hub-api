/**
 * Routes catalogue (applications disponibles à la vente).
 */
const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const catalogue = require('../controllers/catalogue.controller');

const router = express.Router();

router.get('/applications', exigerAuthentification, catalogue.listeApplications);
router.get('/ecoles', exigerAuthentification, catalogue.listeEcoles);

module.exports = router;
