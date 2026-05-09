/**
 * Applications EPS — programme français Jules Verne (BAC + classe).
 */
const express = require('express');
const { exigerAbonnementPourApp } = require('../middleware/abonnement-app.middleware');
const { journaliserAccesEpsJv } = require('../middleware/activity-app.middleware');
const { EPS_BAC_JV, EPS_CLASSE_JV } = require('../constants/applications');
const eps = require('../controllers/eps.ci.controller');

const router = express.Router();

router.use(journaliserAccesEpsJv);

const abonnementBac = exigerAbonnementPourApp(EPS_BAC_JV);
const abonnementClasse = exigerAbonnementPourApp(EPS_CLASSE_JV);

router.get('/bac/epreuves', abonnementBac, (req, res, next) =>
  eps.catalogueEpreuves(req, res, next, 'jv')
);

router.get('/bac/eleves', abonnementBac, (req, res, next) =>
  eps.listeEleves(req, res, next, 'bac_fr')
);
router.post('/bac/eleves', abonnementBac, (req, res, next) =>
  eps.creerEleve(req, res, next, 'bac_fr')
);
router.delete('/bac/eleves/:id', abonnementBac, (req, res, next) =>
  eps.supprimerEleve(req, res, next, 'bac_fr')
);

router.get('/bac/eleves/:eleveId/lignes', abonnementBac, (req, res, next) =>
  eps.listeLignesBac(req, res, next, 'bac_fr')
);
router.post('/bac/lignes', abonnementBac, (req, res, next) =>
  eps.ajouterLigneBac(req, res, next, 'bac_fr')
);

router.get('/classe/eleves', abonnementClasse, (req, res, next) =>
  eps.listeEleves(req, res, next, 'classe_fr')
);
router.post('/classe/eleves', abonnementClasse, (req, res, next) =>
  eps.creerEleve(req, res, next, 'classe_fr')
);
router.delete('/classe/eleves/:id', abonnementClasse, (req, res, next) =>
  eps.supprimerEleve(req, res, next, 'classe_fr')
);

router.get('/classe/eleves/:eleveId/notations', abonnementClasse, (req, res, next) =>
  eps.listeNotationsClasse(req, res, next, 'classe_fr')
);
router.post('/classe/notations', abonnementClasse, (req, res, next) =>
  eps.ajouterNotationClasse(req, res, next, 'classe_fr')
);

module.exports = router;
