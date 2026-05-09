/**
 * API publique (sans jeton).
 */
const express = require('express');
const publicOffres = require('../controllers/public_offres.controller');

const router = express.Router();

router.get('/comparaison-offres', publicOffres.comparaisonOffres);

module.exports = router;
