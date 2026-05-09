/**
 * Création session checkout Wave — montant recalculé côté serveur depuis le catalogue.
 */
const { Op } = require('sequelize');
const { Application, Ecole, Paiement, Utilisateur } = require('../models');
const { creerSessionCheckout } = require('../services/wave.api');
const { totalPourAppsIds } = require('../services/catalogue.montant');
const { sessionWaveSchema } = require('../utils/validation.paiements');
const { sessionCollectifSchema } = require('../utils/validation.collectif');

function urlFrontend() {
  const brut = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
  return brut.split(',')[0].trim().replace(/\/$/, '');
}

function arrondirFcfa(n) {
  return Math.round(Number(n));
}

async function creerSessionWave(req, res, next) {
  try {
    const parse = sessionWaveSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const cmd = parse.data;

    const apps = await Application.findAll({
      where: {
        id: { [Op.in]: cmd.apps_incluses },
        deleted_at: null,
      },
    });

    if (apps.length !== cmd.apps_incluses.length) {
      return res.status(400).json({
        erreur: 'Une ou plusieurs applications sont introuvables.',
      });
    }

    let ecoleChargee = null;
    if (cmd.ecole_id) {
      ecoleChargee = await Ecole.findOne({
        where: { id: cmd.ecole_id, deleted_at: null },
      });
      if (!ecoleChargee) {
        return res.status(400).json({ erreur: 'École introuvable.' });
      }
    }

    for (const app of apps) {
      if (app.rubrique !== cmd.rubrique) {
        return res.status(400).json({
          erreur: `L’application « ${app.nom} » ne correspond pas à la rubrique ${cmd.rubrique}.`,
        });
      }
      if (ecoleChargee && app.specifique_ecole) {
        const liste = Array.isArray(ecoleChargee.apps_disponibles)
          ? ecoleChargee.apps_disponibles
          : [];
        const ok = liste.some((id) => String(id) === String(app.id));
        if (!ok) {
          return res.status(400).json({
            erreur: `L’application « ${app.nom} » n’est pas disponible pour cette école.`,
          });
        }
      }
    }

    const attendu = await totalPourAppsIds(cmd.apps_incluses);

    if (arrondirFcfa(cmd.montant) !== attendu) {
      return res.status(400).json({
        erreur: `Montant invalide. Total catalogue : ${attendu} FCFA (vous avez envoyé ${arrondirFcfa(cmd.montant)}).`,
        montant_attendu: attendu,
      });
    }

    const donneesCommande = {
      rubrique: cmd.rubrique,
      type_abonnement: cmd.type_abonnement,
      programme: cmd.programme,
      sport: cmd.sport || null,
      ecole_id: cmd.ecole_id || null,
      parcours_francais: cmd.parcours_francais || null,
      apps_incluses: cmd.apps_incluses,
      duree_jours: cmd.duree_jours,
    };

    const paiement = await Paiement.create({
      utilisateur_id: req.utilisateur.id,
      montant: attendu,
      devise: 'XOF',
      statut: 'pending',
      donnees_commande: donneesCommande,
    });

    const base = urlFrontend();
    const corpsWave = {
      amount: String(attendu),
      currency: 'XOF',
      client_reference: paiement.id,
      success_url: `${base}/paiement/reussi?ref=${encodeURIComponent(paiement.id)}`,
      error_url: `${base}/paiement/echec?ref=${encodeURIComponent(paiement.id)}`,
    };

    let session;
    try {
      session = await creerSessionCheckout(corpsWave);
    } catch (err) {
      await paiement.update({ statut: 'failed' });
      return res.status(502).json({
        erreur: 'Impossible de joindre Wave.',
        detail: process.env.NODE_ENV === 'development' ? String(err.message) : undefined,
      });
    }

    await paiement.update({
      wave_session_id: session.id || session.session_id || null,
    });

    return res.status(201).json({
      wave_launch_url: session.wave_launch_url,
      paiement_id: paiement.id,
      wave_session_id: session.id,
      montant_fcfa: attendu,
    });
  } catch (err) {
    return next(err);
  }
}

/** Valide cohérence rubrique / programme pour une ligne bénéficiaire. */
function validerRubriqueProgramme(rubrique, programme) {
  if (rubrique === 'ENSEIGNEMENT_CI' && programme !== 'ivoirien') {
    return 'ENSEIGNEMENT_CI impose programme ivoirien.';
  }
  if (rubrique === 'ENSEIGNEMENT_FR' && programme !== 'francais') {
    return 'ENSEIGNEMENT_FR impose programme français.';
  }
  return null;
}

/**
 * Paiement Wave pour plusieurs profs EPS rattachés à la même école (admin école payeur).
 */
async function creerSessionCollectifWave(req, res, next) {
  try {
    const parse = sessionCollectifSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const admin = req.utilisateur;
    if (admin.type_utilisateur !== 'admin_ecole') {
      return res.status(403).json({ erreur: 'Réservé aux administrateurs d’école.' });
    }
    if (!admin.ecole_id || String(admin.ecole_id) !== String(parse.data.ecole_id)) {
      return res.status(403).json({
        erreur: 'Votre compte n’est pas rattaché à cette école.',
      });
    }

    const ecoleChargee = await Ecole.findOne({
      where: { id: parse.data.ecole_id, deleted_at: null },
    });
    if (!ecoleChargee) {
      return res.status(400).json({ erreur: 'École introuvable.' });
    }

    const beneficiairesEnrichis = [];
    let total = 0;

    for (const b of parse.data.beneficiaires) {
      const msgRp = validerRubriqueProgramme(b.rubrique, b.programme);
      if (msgRp) {
        return res.status(400).json({ erreur: msgRp });
      }

      const prof = await Utilisateur.findOne({
        where: {
          id: b.utilisateur_id,
          deleted_at: null,
          ecole_id: parse.data.ecole_id,
          type_utilisateur: 'prof_eps',
        },
      });
      if (!prof) {
        return res.status(400).json({
          erreur: `Profil EPS introuvable ou non rattaché à l’école : ${b.utilisateur_id}`,
        });
      }

      const apps = await Application.findAll({
        where: { id: { [Op.in]: b.apps_incluses }, deleted_at: null },
      });
      if (apps.length !== b.apps_incluses.length) {
        return res.status(400).json({ erreur: 'Applications invalides pour un bénéficiaire.' });
      }

      for (const app of apps) {
        if (app.rubrique !== b.rubrique) {
          return res.status(400).json({
            erreur: `Rubrique incohérente pour ${prof.prenom} ${prof.nom}.`,
          });
        }
        if (b.rubrique === 'ENSEIGNEMENT_FR' && app.specifique_ecole) {
          const liste = Array.isArray(ecoleChargee.apps_disponibles)
            ? ecoleChargee.apps_disponibles
            : [];
          if (!liste.some((id) => String(id) === String(app.id))) {
            return res.status(400).json({
              erreur: `Application « ${app.nom} » non disponible pour cette école.`,
            });
          }
        }
      }

      const montantLigne = await totalPourAppsIds(b.apps_incluses);
      total += montantLigne;

      beneficiairesEnrichis.push({
        utilisateur_id: b.utilisateur_id,
        rubrique: b.rubrique,
        type_abonnement: b.type_abonnement,
        programme: b.programme,
        sport: b.sport || null,
        apps_incluses: b.apps_incluses,
        montant_fcfa: montantLigne,
      });
    }

    const donneesCommande = {
      mode: 'collectif_ecole',
      ecole_id: parse.data.ecole_id,
      duree_jours: parse.data.duree_jours,
      beneficiaires: beneficiairesEnrichis,
    };

    const paiement = await Paiement.create({
      utilisateur_id: admin.id,
      montant: total,
      devise: 'XOF',
      statut: 'pending',
      donnees_commande: donneesCommande,
    });

    const base = urlFrontend();
    const corpsWave = {
      amount: String(total),
      currency: 'XOF',
      client_reference: paiement.id,
      success_url: `${base}/paiement/reussi?ref=${encodeURIComponent(paiement.id)}`,
      error_url: `${base}/paiement/echec?ref=${encodeURIComponent(paiement.id)}`,
    };

    let session;
    try {
      session = await creerSessionCheckout(corpsWave);
    } catch (err) {
      await paiement.update({ statut: 'failed' });
      return res.status(502).json({
        erreur: 'Impossible de joindre Wave.',
        detail: process.env.NODE_ENV === 'development' ? String(err.message) : undefined,
      });
    }

    await paiement.update({
      wave_session_id: session.id || session.session_id || null,
    });

    return res.status(201).json({
      wave_launch_url: session.wave_launch_url,
      paiement_id: paiement.id,
      wave_session_id: session.id,
      montant_fcfa_total: total,
      beneficiaires: beneficiairesEnrichis.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { creerSessionWave, creerSessionCollectifWave };
