/**
 * Applications EPS — programme ivoirien (BAC + classe).
 */
const express = require('express');
const { exigerAbonnementPourApp } = require('../middleware/abonnement-app.middleware');
const { journaliserAccesEpsCi } = require('../middleware/activity-app.middleware');
const { EPS_BAC_CI, EPS_CLASSE_CI } = require('../constants/applications');
const eps = require('../controllers/eps.ci.controller');

const router = express.Router();

router.use(journaliserAccesEpsCi);

const abonnementBac = exigerAbonnementPourApp(EPS_BAC_CI);
const abonnementClasse = exigerAbonnementPourApp(EPS_CLASSE_CI);

router.get('/bac/epreuves', abonnementBac, (req, res, next) =>
  eps.catalogueEpreuves(req, res, next, 'ci')
);

router.get('/bac/eleves', abonnementBac, (req, res, next) =>
  eps.listeEleves(req, res, next, 'bac_ci')
);
router.post('/bac/eleves', abonnementBac, (req, res, next) =>
  eps.creerEleve(req, res, next, 'bac_ci')
);
router.delete('/bac/eleves/:id', abonnementBac, (req, res, next) =>
  eps.supprimerEleve(req, res, next, 'bac_ci')
);

router.get('/bac/eleves/:eleveId/lignes', abonnementBac, (req, res, next) =>
  eps.listeLignesBac(req, res, next, 'bac_ci')
);
router.post('/bac/lignes', abonnementBac, (req, res, next) =>
  eps.ajouterLigneBac(req, res, next, 'bac_ci')
);

router.get('/classe/eleves', abonnementClasse, (req, res, next) =>
  eps.listeEleves(req, res, next, 'classe_ci')
);
router.post('/classe/eleves', abonnementClasse, (req, res, next) =>
  eps.creerEleve(req, res, next, 'classe_ci')
);
router.delete('/classe/eleves/:id', abonnementClasse, (req, res, next) =>
  eps.supprimerEleve(req, res, next, 'classe_ci')
);

router.get('/classe/eleves/:eleveId/notations', abonnementClasse, (req, res, next) =>
  eps.listeNotationsClasse(req, res, next, 'classe_ci')
);
router.post('/classe/notations', abonnementClasse, (req, res, next) =>
  eps.ajouterNotationClasse(req, res, next, 'classe_ci')
);

module.exports = router;
