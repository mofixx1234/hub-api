/**
 * Routes authentification (FR).
 */
const express = require('express');
const auth = require('../controllers/auth.controller');
const { exigerAuthentification } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/inscription', auth.inscription);
router.post('/connexion', auth.connexion);
router.post('/mot-de-passe/demande', auth.demandeMotDePasseOublie);
router.post('/mot-de-passe/confirmer', auth.confirmerMotDePasse);
router.post('/deconnexion', exigerAuthentification, auth.deconnexion);
router.get('/moi', exigerAuthentification, auth.moi);
router.post('/onboarding/terminer', exigerAuthentification, auth.terminerOnboarding);
router.post('/accepter-cgu', exigerAuthentification, auth.accepterCgu);

module.exports = router;
