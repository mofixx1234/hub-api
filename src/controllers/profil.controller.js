/**
 * Profil utilisateur, préférences, données, corbeille, paiements, suppression compte.
 */
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  Utilisateur,
  UserPreference,
  Ecole,
  EpsEleve,
  EpsBacLigne,
  EpsClasseNotation,
  Joueur,
  Match,
  Paiement,
  Abonnement,
  SessionActive,
  ActivityLog,
} = require('../models');
const { avatarsDir } = require('../config/upload.paths');
const {
  profilMajSchema,
  preferencesMajSchema,
  exportDonneesSchema,
  supprimerCompteSchema,
  changerMdpSchema,
} = require('../utils/validation.profil');
const activityLog = require('../services/activityLog.service');
const { envoyerEmailSuppressionCompte } = require('../services/email');

const SALT_ROUNDS = 12;
const PURGE_JOURS = 30;

function arrondirFcfa(n) {
  return Math.round(Number(n));
}

function libelleCommandePaiement(cmd) {
  if (!cmd || typeof cmd !== 'object') return 'Paiement';
  const r = cmd.rubrique;
  if (r === 'SPORT') return `SPORT — ${cmd.sport || 'Sport'}`;
  if (r === 'ENSEIGNEMENT_CI') return 'Enseignement ivoirien';
  if (r === 'ENSEIGNEMENT_FR') return 'Jules Verne';
  return String(r || 'Paiement');
}

function statutPaiementLibelle(statut) {
  if (statut === 'success') return 'paye';
  if (statut === 'failed') return 'echoue';
  return 'en_attente';
}

async function preferencesParDefaut(userId) {
  const [pref] = await UserPreference.findOrCreate({
    where: { user_id: userId },
    defaults: {
      user_id: userId,
      notif_connexion: true,
      notif_expiration: true,
      notif_rapport: true,
      notif_newsletter: false,
      theme: 'dark',
      langue: 'fr',
    },
  });
  return pref;
}

function serialiserPreferences(p) {
  return {
    notif_connexion: p.notif_connexion,
    notif_expiration: p.notif_expiration,
    notif_rapport: p.notif_rapport,
    notif_newsletter: p.notif_newsletter,
    theme: p.theme,
    langue: p.langue,
  };
}

async function getProfil(req, res, next) {
  try {
    const u = await Utilisateur.findByPk(req.utilisateur.id, {
      include: [{ model: Ecole, as: 'ecole', required: false }],
    });
    const pref = await preferencesParDefaut(u.id);
    return res.json({
      profil: {
        id: u.id,
        email: u.email,
        prenom: u.prenom,
        nom: u.nom,
        type_utilisateur: u.type_utilisateur,
        photo_url: u.photo_url || null,
        telephone: u.telephone || null,
        ville: u.ville || null,
        nom_club: u.nom_club || null,
        ecole_id: u.ecole_id || null,
        ecole: u.ecole
          ? { id: u.ecole.id, nom: u.ecole.nom, programme: u.ecole.programme }
          : null,
        onboarding_complete: Boolean(u.onboarding_complete),
      },
      preferences: serialiserPreferences(pref),
    });
  } catch (err) {
    return next(err);
  }
}

async function patchProfil(req, res, next) {
  try {
    const parse = profilMajSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }

    const data = parse.data;
    const u = await Utilisateur.findByPk(req.utilisateur.id);
    if (!u || u.deleted_at) {
      return res.status(404).json({ erreur: 'Compte introuvable.' });
    }

    const emailNouveau = data.email?.trim().toLowerCase();
    if (emailNouveau && emailNouveau !== u.email) {
      if (!data.mot_de_passe_actuel) {
        return res.status(400).json({
          erreur: 'Pour changer d’adresse e-mail, confirmez votre mot de passe actuel.',
        });
      }
      const okMdp = await bcrypt.compare(data.mot_de_passe_actuel, u.mot_de_passe);
      if (!okMdp) {
        return res.status(401).json({ erreur: 'Mot de passe actuel incorrect.' });
      }
      const existe = await Utilisateur.findOne({
        where: { email: emailNouveau, deleted_at: null },
      });
      if (existe && existe.id !== u.id) {
        return res.status(409).json({ erreur: 'Cette adresse e-mail est déjà utilisée.' });
      }
      await u.update({ email: emailNouveau });
    }

    const maj = {};
    if (data.prenom !== undefined) maj.prenom = data.prenom.trim();
    if (data.nom !== undefined) maj.nom = data.nom.trim();
    if (data.telephone !== undefined) maj.telephone = data.telephone;
    if (data.ville !== undefined) maj.ville = data.ville;
    if (data.nom_club !== undefined) maj.nom_club = data.nom_club;

    if (Object.keys(maj).length) await u.update(maj);
    await u.reload({ include: [{ model: Ecole, as: 'ecole', required: false }] });

    return res.json({
      message: 'Profil mis à jour.',
      profil: {
        id: u.id,
        email: u.email,
        prenom: u.prenom,
        nom: u.nom,
        type_utilisateur: u.type_utilisateur,
        photo_url: u.photo_url || null,
        telephone: u.telephone || null,
        ville: u.ville || null,
        nom_club: u.nom_club || null,
        ecole_id: u.ecole_id || null,
        ecole: u.ecole
          ? { id: u.ecole.id, nom: u.ecole.nom, programme: u.ecole.programme }
          : null,
        onboarding_complete: Boolean(u.onboarding_complete),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function postAvatar(req, res, next) {
  try {
    if (!req.file?.filename) {
      return res.status(400).json({ erreur: 'Fichier image requis (champ « photo »).' });
    }
    const u = await Utilisateur.findByPk(req.utilisateur.id);
    const rel = `/uploads/avatars/${req.file.filename}`;
    const ancien = u.photo_url;
    await u.update({ photo_url: rel });

    if (ancien && ancien.startsWith('/uploads/avatars/')) {
      const abs = path.join(avatarsDir, path.basename(ancien));
      try {
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch {
        /* ignore */
      }
    }

    return res.json({ message: 'Photo mise à jour.', photo_url: rel });
  } catch (err) {
    return next(err);
  }
}

async function getPreferences(req, res, next) {
  try {
    const pref = await preferencesParDefaut(req.utilisateur.id);
    return res.json(serialiserPreferences(pref));
  } catch (err) {
    return next(err);
  }
}

async function patchPreferences(req, res, next) {
  try {
    const parse = preferencesMajSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const pref = await preferencesParDefaut(req.utilisateur.id);
    await pref.update(parse.data);
    return res.json(serialiserPreferences(pref));
  } catch (err) {
    return next(err);
  }
}

async function getDonneesResume(req, res, next) {
  try {
    const userId = req.utilisateur.id;
    const [nbBac, nbClasse, nbJoueurs, nbExports, dernierExport] = await Promise.all([
      EpsBacLigne.count({
        where: { deleted_at: null },
        include: [
          {
            model: EpsEleve,
            as: 'eleve',
            required: true,
            where: { utilisateur_id: userId, deleted_at: null },
          },
        ],
      }),
      EpsClasseNotation.count({
        where: { deleted_at: null },
        include: [
          {
            model: EpsEleve,
            as: 'eleve',
            required: true,
            where: { utilisateur_id: userId, deleted_at: null },
          },
        ],
      }),
      Joueur.count({ where: { utilisateur_id: userId, deleted_at: null } }),
      ActivityLog.count({
        where: { user_id: userId, action: 'export_donnees' },
      }),
      ActivityLog.findOne({
        where: { user_id: userId, action: { [Op.in]: ['export_donnees', 'sauvegarde_manuelle'] } },
        order: [['created_at', 'DESC']],
        attributes: ['created_at'],
      }),
    ]);

    const pref = await preferencesParDefaut(userId);
    const prochain = new Date();
    prochain.setMonth(prochain.getMonth() + 1);
    prochain.setDate(1);
    prochain.setHours(0, 0, 0, 0);

    return res.json({
      stockage: {
        message:
          'Vos données sont stockées de manière sécurisée sur nos serveurs. Aucune donnée n’est partagée.',
      },
      statistiques: {
        notes_eleves: nbBac + nbClasse,
        joueurs_geres: nbJoueurs,
        exports_effectues: nbExports,
        derniere_sauvegarde_at: dernierExport?.created_at?.toISOString() || null,
      },
      sauvegarde_auto: {
        active: Boolean(pref.notif_rapport),
        prochaine_sauvegarde: prochain.toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
}

function periodeVersDateDebut(periode) {
  const d = new Date();
  if (periode === 'mois') {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periode === '6_mois') {
    d.setMonth(d.getMonth() - 6);
    return d;
  }
  return new Date(0);
}

async function postExportDonnees(req, res, next) {
  try {
    const parse = exportDonneesSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const { format, periode, app } = parse.data;
    const userId = req.utilisateur.id;
    const depuis = periodeVersDateDebut(periode);

    const inclutJoueurs = app === 'toutes' || app === 'gestion';
    const inclutMatchs = app === 'toutes' || app === 'stats';
    const inclutEps = app === 'toutes' || app === 'eval_bac';

    const payload = {
      genere_le: new Date().toISOString(),
      periode,
      app,
      utilisateur_id: userId,
      joueurs: [],
      matchs: [],
      eps_eleves: [],
    };

    if (inclutJoueurs) {
      payload.joueurs = await Joueur.findAll({
        where: {
          utilisateur_id: userId,
          deleted_at: null,
          created_at: { [Op.gte]: depuis },
        },
        attributes: ['id', 'nom', 'numero', 'position', 'created_at'],
        raw: true,
      });
    }
    if (inclutMatchs) {
      payload.matchs = await Match.findAll({
        where: {
          utilisateur_id: userId,
          deleted_at: null,
          created_at: { [Op.gte]: depuis },
        },
        attributes: ['id', 'joue_le', 'adversaire', 'lieu', 'score_pour', 'score_contre', 'created_at'],
        raw: true,
      });
    }

    if (inclutEps) {
      const eleves = await EpsEleve.findAll({
        where: {
          utilisateur_id: userId,
          deleted_at: null,
          created_at: { [Op.gte]: depuis },
        },
        include: [
          {
            model: EpsBacLigne,
            as: 'lignes_bac',
            required: false,
            where: { deleted_at: null },
          },
          {
            model: EpsClasseNotation,
            as: 'notations_classe',
            required: false,
            where: { deleted_at: null },
          },
        ],
      });
      payload.eps_eleves = eleves.map((e) => ({
        id: e.id,
        scope: e.scope,
        nom: e.nom,
        prenom: e.prenom,
        classe: e.classe,
        lignes_bac: (e.lignes_bac || []).map((l) => ({
          code_epreuve: l.code_epreuve,
          valeur_brute: l.valeur_brute,
          points_attribues: l.points_attribues,
        })),
        notations_classe: (e.notations_classe || []).map((n) => ({
          titre: n.titre,
          note: n.note,
          periode: n.periode,
        })),
      }));
    }

    activityLog.enregistrerAsync({
      userId,
      action: 'export_donnees',
      appName: 'hub',
      metadata: { format, periode, app },
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="hub-export.json"');
      return res.send(JSON.stringify(payload, null, 2));
    }

    if (format === 'csv') {
      const lignes = [];
      lignes.push('type,id,detail');
      for (const j of payload.joueurs) {
        lignes.push(`joueur,${j.id},${j.nom}`);
      }
      for (const m of payload.matchs) {
        lignes.push(`match,${m.id},${m.joue_le} ${m.adversaire}`);
      }
      for (const e of payload.eps_eleves) {
        lignes.push(`eleve,${e.id},${e.prenom} ${e.nom}`);
      }
      const csv = `${lignes.join('\n')}\n`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="hub-export.csv"');
      return res.send(csv);
    }

    return res.status(501).json({
      erreur: 'Les exports PDF et Excel seront disponibles prochainement. Utilisez CSV ou JSON.',
      formats_disponibles: ['csv', 'json'],
    });
  } catch (err) {
    return next(err);
  }
}

async function postSauvegardeMaintenant(req, res, next) {
  try {
    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'sauvegarde_manuelle',
      appName: 'hub',
      metadata: {},
    });
    return res.json({
      message:
        'Une copie de vos données a été demandée. Vous recevrez un e-mail lorsque le fichier sera prêt (fonctionnalité progressive).',
    });
  } catch (err) {
    return next(err);
  }
}

function joursDepuis(date) {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function libelleEleveCorbeille(e) {
  const bac = e.scope === 'bac_ci' || e.scope === 'bac_fr';
  if (bac) {
    const mois = new Date(e.created_at || Date.now()).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    return { type: 'eleve_bac', libelle: `Session BAC : ${mois}`, sous_titre: `${e.prenom} ${e.nom}` };
  }
  return { type: 'eleve', libelle: `Élève : ${e.prenom} ${e.nom}` };
}

async function getCorbeille(req, res, next) {
  try {
    const userId = req.utilisateur.id;
    const [eleves, joueurs, matchs] = await Promise.all([
      EpsEleve.findAll({
        where: { utilisateur_id: userId, deleted_at: { [Op.ne]: null } },
        order: [['deleted_at', 'DESC']],
      }),
      Joueur.findAll({
        where: { utilisateur_id: userId, deleted_at: { [Op.ne]: null } },
        order: [['deleted_at', 'DESC']],
      }),
      Match.findAll({
        where: { utilisateur_id: userId, deleted_at: { [Op.ne]: null } },
        order: [['deleted_at', 'DESC']],
      }),
    ]);

    const items = [];

    for (const e of eleves) {
      const meta = libelleEleveCorbeille(e);
      const delAt = new Date(e.deleted_at);
      const ecoules = joursDepuis(delAt);
      items.push({
        id: e.id,
        categorie: meta.type === 'eleve_bac' ? 'eleve_bac' : 'eleve',
        libelle: meta.libelle,
        sous_titre: meta.sous_titre || null,
        supprime_il_y_a_jours: ecoules,
        expire_dans_jours: Math.max(0, PURGE_JOURS - ecoules),
        deleted_at: delAt.toISOString(),
      });
    }
    for (const j of joueurs) {
      const delAt = new Date(j.deleted_at);
      const ecoules = joursDepuis(delAt);
      items.push({
        id: j.id,
        categorie: 'joueur',
        libelle: `Joueur : ${j.nom}`,
        sous_titre: null,
        supprime_il_y_a_jours: ecoules,
        expire_dans_jours: Math.max(0, PURGE_JOURS - ecoules),
        deleted_at: delAt.toISOString(),
      });
    }
    for (const m of matchs) {
      const delAt = new Date(m.deleted_at);
      const ecoules = joursDepuis(delAt);
      items.push({
        id: m.id,
        categorie: 'match',
        libelle: `Match : ${m.adversaire}`,
        sous_titre: String(m.joue_le || ''),
        supprime_il_y_a_jours: ecoules,
        expire_dans_jours: Math.max(0, PURGE_JOURS - ecoules),
        deleted_at: delAt.toISOString(),
      });
    }

    items.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

    return res.json({ elements: items });
  } catch (err) {
    return next(err);
  }
}

async function postRestaurerCorbeille(req, res, next) {
  try {
    const { type, id } = req.params;
    const userId = req.utilisateur.id;

    if (type === 'eleve' || type === 'eleve_bac') {
      const e = await EpsEleve.findOne({
        where: { id, utilisateur_id: userId, deleted_at: { [Op.ne]: null } },
      });
      if (!e) return res.status(404).json({ erreur: 'Élément introuvable dans la corbeille.' });
      await e.update({ deleted_at: null });
      return res.json({ message: 'Élève restauré.' });
    }
    if (type === 'joueur') {
      const j = await Joueur.findOne({
        where: { id, utilisateur_id: userId, deleted_at: { [Op.ne]: null } },
      });
      if (!j) return res.status(404).json({ erreur: 'Élément introuvable dans la corbeille.' });
      await j.update({ deleted_at: null });
      return res.json({ message: 'Joueur restauré.' });
    }
    if (type === 'match') {
      const m = await Match.findOne({
        where: { id, utilisateur_id: userId, deleted_at: { [Op.ne]: null } },
      });
      if (!m) return res.status(404).json({ erreur: 'Élément introuvable dans la corbeille.' });
      await m.update({ deleted_at: null });
      return res.json({ message: 'Match restauré.' });
    }
    return res.status(400).json({ erreur: 'Type inconnu (eleve, joueur, match).' });
  } catch (err) {
    return next(err);
  }
}

async function postViderCorbeille(req, res, next) {
  try {
    const userId = req.utilisateur.id;
    const whereTrash = { utilisateur_id: userId, deleted_at: { [Op.ne]: null } };

    const [e, j, m] = await Promise.all([
      EpsEleve.destroy({ where: whereTrash }),
      Joueur.destroy({ where: whereTrash }),
      Match.destroy({ where: whereTrash }),
    ]);

    return res.json({
      message: 'Corbeille vidée définitivement.',
      supprime: { eleves: e, joueurs: j, matchs: m },
    });
  } catch (err) {
    return next(err);
  }
}

async function getPaiements(req, res, next) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const taille = 10;
    const filtre = String(req.query.filtre || 'tous');

    const where = {
      utilisateur_id: req.utilisateur.id,
      deleted_at: null,
    };
    if (filtre === 'payes') where.statut = 'success';
    else if (filtre === 'echoues') where.statut = 'failed';

    const { count, rows } = await Paiement.findAndCountAll({
      where,
      order: [
        [sequelize.literal('COALESCE(date_paiement, created_at)'), 'DESC'],
        ['id', 'DESC'],
      ],
      limit: taille,
      offset: (page - 1) * taille,
    });

    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const totalMois = await Paiement.sum('montant', {
      where: {
        utilisateur_id: req.utilisateur.id,
        deleted_at: null,
        statut: 'success',
        date_paiement: { [Op.gte]: debutMois },
      },
    });

    const paiements = rows.map((p) => ({
      id: p.id,
      date: (p.date_paiement || p.created_at)?.toISOString?.() || null,
      description: libelleCommandePaiement(p.donnees_commande),
      montant_fcfa: arrondirFcfa(p.montant),
      statut: statutPaiementLibelle(p.statut),
      statut_brut: p.statut,
    }));

    return res.json({
      paiements,
      pagination: { page, taille, total: count, pages: Math.ceil(count / taille) || 1 },
      total_paye_mois_fcfa: arrondirFcfa(totalMois || 0),
    });
  } catch (err) {
    return next(err);
  }
}

async function getFacture(req, res, next) {
  try {
    const p = await Paiement.findOne({
      where: { id: req.params.id, utilisateur_id: req.utilisateur.id, deleted_at: null },
    });
    if (!p) return res.status(404).json({ erreur: 'Paiement introuvable.' });

    const texte = [
      'HUB — Facture simplifiée',
      `Réf. paiement : ${p.id}`,
      `Montant : ${arrondirFcfa(p.montant)} ${p.devise}`,
      `Statut : ${p.statut}`,
      `Libellé : ${libelleCommandePaiement(p.donnees_commande)}`,
      p.transaction_wave_id ? `Transaction Wave : ${p.transaction_wave_id}` : '',
      '',
      'Document généré automatiquement — sans valeur fiscale.',
    ]
      .filter(Boolean)
      .join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${p.id}.txt"`);
    return res.send(texte);
  } catch (err) {
    return next(err);
  }
}

async function postSupprimerCompte(req, res, next) {
  try {
    const parse = supprimerCompteSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const email = parse.data.email.trim().toLowerCase();
    const u = await Utilisateur.findByPk(req.utilisateur.id);
    if (!u || u.deleted_at) {
      return res.status(404).json({ erreur: 'Compte introuvable.' });
    }
    if (email !== u.email) {
      return res.status(400).json({ erreur: 'L’adresse e-mail ne correspond pas à votre compte.' });
    }
    const ok = await bcrypt.compare(parse.data.mot_de_passe, u.mot_de_passe);
    if (!ok) {
      return res.status(401).json({ erreur: 'Mot de passe incorrect.' });
    }

    await sequelize.transaction(async (t) => {
      await Abonnement.update(
        { statut: 'suspendu' },
        { where: { utilisateur_id: u.id, statut: 'actif', deleted_at: null }, transaction: t }
      );
      await SessionActive.destroy({ where: { utilisateur_id: u.id }, transaction: t });
      await u.update({ deleted_at: new Date() }, { transaction: t });
    });

    await envoyerEmailSuppressionCompte({
      destinataire: u.email,
      prenom: u.prenom,
      delaiJours: PURGE_JOURS,
    });

    activityLog.enregistrerAsync({
      userId: u.id,
      action: 'compte_suppression_demandee',
      appName: 'hub',
      metadata: {},
    });

    return res.json({
      message:
        'Votre compte sera définitivement supprimé sous 30 jours. Toutes les sessions sont fermées.',
    });
  } catch (err) {
    return next(err);
  }
}

async function postChangerMotDePasse(req, res, next) {
  try {
    const parse = changerMdpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const u = await Utilisateur.findByPk(req.utilisateur.id);
    if (!u || u.deleted_at) {
      return res.status(404).json({ erreur: 'Compte introuvable.' });
    }
    const ok = await bcrypt.compare(parse.data.ancien, u.mot_de_passe);
    if (!ok) {
      return res.status(401).json({ erreur: 'Ancien mot de passe incorrect.' });
    }
    const hash = await bcrypt.hash(parse.data.nouveau, SALT_ROUNDS);
    await u.update({ mot_de_passe: hash });
    return res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfil,
  patchProfil,
  postAvatar,
  getPreferences,
  patchPreferences,
  getDonneesResume,
  postExportDonnees,
  postSauvegardeMaintenant,
  getCorbeille,
  postRestaurerCorbeille,
  postViderCorbeille,
  getPaiements,
  getFacture,
  postSupprimerCompte,
  postChangerMotDePasse,
};
