/**
 * Routes Hub — données personnalisées abonnements / accès.
 */
const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const monHub = require('../controllers/mon_hub.controller');

const router = express.Router();

router.get('/abonnements', exigerAuthentification, monHub.listeAbonnements);

module.exports = router;
