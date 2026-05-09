/**
 * Évaluation classe EPS — routes sous /api/apps/eval-classe
 */
const express = require('express');
const ctrl = require('../controllers/eval_classe.controller');

const router = express.Router();

router.get('/dashboard', ctrl.dashboard);

router.get('/classes', ctrl.listeClasses);
router.post('/classes', ctrl.creerClasse);
router.get('/classes/:classeId', ctrl.detailClasse);
router.patch('/classes/:classeId', ctrl.patchClasse);
router.delete('/classes/:classeId', ctrl.supprimerClasse);

router.get('/classes/:classeId/eleves', ctrl.listeEleves);
router.post('/classes/:classeId/eleves', ctrl.creerEleve);
router.get('/classes/:classeId/seances', ctrl.listeSeances);
router.post('/classes/:classeId/seances', ctrl.creerSeance);

router.patch('/eleves/:eleveId', ctrl.patchEleve);
router.delete('/eleves/:eleveId', ctrl.supprimerEleve);

router.get('/seances/:seanceId', ctrl.detailSeance);
router.put('/seances/:seanceId/notes', ctrl.enregistrerNotes);

router.get('/classes/:classeId/moyennes', ctrl.moyennesClasse);
router.get('/eleves/:eleveId/bulletin', ctrl.bulletinEleve);
router.get('/eleves/:eleveId/bulletin.pdf', ctrl.bulletinPdf);

module.exports = router;
