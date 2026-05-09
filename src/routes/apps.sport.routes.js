/**
 * Applications métier Sport — gestion d’équipe (abonnement requis).
 */
const express = require('express');
const { exigerAbonnementPourApp } = require('../middleware/abonnement-app.middleware');
const { journaliserAccesSport } = require('../middleware/activity-app.middleware');
const { SPORT_GESTION_EQUIPE, SPORT_STATS } = require('../constants/applications');
const joueurs = require('../controllers/joueurs.controller');
const stats = require('../controllers/sport.stats.controller');

const router = express.Router();

router.use(journaliserAccesSport);

const abonnementGestion = exigerAbonnementPourApp(SPORT_GESTION_EQUIPE);
const abonnementStats = exigerAbonnementPourApp(SPORT_STATS);

router.get('/joueurs', abonnementGestion, joueurs.lister);
router.post('/joueurs', abonnementGestion, joueurs.creer);
router.patch('/joueurs/:id', abonnementGestion, joueurs.modifier);
router.delete('/joueurs/:id', abonnementGestion, joueurs.supprimer);

router.get('/stats/matchs', abonnementStats, stats.listerMatchs);
router.post('/stats/matchs', abonnementStats, stats.creerMatch);
router.get('/stats/matchs/:id', abonnementStats, stats.detailMatch);
router.patch('/stats/matchs/:id', abonnementStats, stats.modifierMatch);
router.delete('/stats/matchs/:id', abonnementStats, stats.supprimerMatch);
router.post('/stats/matchs/:id/lignes', abonnementStats, stats.enregistrerLignes);

module.exports = router;
