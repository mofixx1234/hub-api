/**
 * Profil, préférences, données, corbeille, paiements (utilisateur connecté).
 */
const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const profil = require('../controllers/profil.controller');
const { avatarUpload } = require('../middleware/upload.avatar.middleware');

const router = express.Router();

router.use(exigerAuthentification);

router.get('/', profil.getProfil);
router.patch('/', profil.patchProfil);
router.post('/avatar', (req, res, next) => {
  avatarUpload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        erreur: err.message || 'Envoi du fichier impossible (taille max. 2 Mo, JPEG/PNG/WebP).',
      });
    }
    return next();
  });
}, profil.postAvatar);

router.get('/preferences', profil.getPreferences);
router.patch('/preferences', profil.patchPreferences);

router.get('/donnees-resume', profil.getDonneesResume);
router.post('/export-donnees', profil.postExportDonnees);
router.post('/sauvegarde-maintenant', profil.postSauvegardeMaintenant);

router.get('/corbeille', profil.getCorbeille);
router.post('/corbeille/:type/:id/restaurer', profil.postRestaurerCorbeille);
router.post('/corbeille/vider', profil.postViderCorbeille);

router.get('/paiements', profil.getPaiements);
router.get('/paiements/:id/facture', profil.getFacture);

router.post('/compte/supprimer', profil.postSupprimerCompte);
router.post('/mot-de-passe', profil.postChangerMotDePasse);

module.exports = router;
