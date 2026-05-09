/**
 * Inscription, connexion (session unique), déconnexion, profil courant.
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Utilisateur, SessionActive, ReinitialisationMdp } = require('../models');
const { signerJeton } = require('../utils/jwt');
const {
  inscriptionSchema,
  connexionSchema,
  demandeMotDePasseSchema,
  confirmerMotDePasseSchema,
} = require('../utils/validation');
const {
  envoyerEmailNouvelleConnexion,
  envoyerEmailReinitialisationMotDePasse,
} = require('../services/email');
const tentatives = require('../services/tentatives_connexion');
const activityLog = require('../services/activityLog.service');

const SALT_ROUNDS = 12;

/** Convertit JWT_EXPIRES_IN (ex: 30d) en millisecondes pour expires_at session. */
function dureeJetonVersMs(exp) {
  if (!exp || typeof exp !== 'string') return 30 * 24 * 60 * 60 * 1000;
  const m = /^(\d+)([dhms])$/i.exec(exp.trim());
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return n * (mult[u] || 86400000);
}

async function inscription(req, res, next) {
  try {
    const parse = inscriptionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const {
      email,
      mot_de_passe,
      prenom,
      nom,
      type_utilisateur = 'entraineur',
      device_id,
      device_name,
    } = parse.data;

    const typeFinal =
      type_utilisateur === 'prof_eps' ? 'prof_eps' : 'entraineur';

    const emailNormalise = email.trim().toLowerCase();

    const existe = await Utilisateur.findOne({
      where: { email: emailNormalise, deleted_at: null },
    });
    if (existe) {
      return res.status(409).json({ erreur: 'Cette adresse e-mail est déjà utilisée.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

    const utilisateur = await Utilisateur.create({
      email: emailNormalise,
      mot_de_passe: hash,
      prenom: prenom.trim(),
      nom: nom.trim(),
      type_utilisateur: typeFinal,
      onboarding_complete: false,
    });

    const sessionId = uuidv4();
    const expiresMs = dureeJetonVersMs(process.env.JWT_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresMs);

    await SessionActive.destroy({ where: { utilisateur_id: utilisateur.id } });

    await SessionActive.create({
      utilisateur_id: utilisateur.id,
      session_id: sessionId,
      device_id: device_id || null,
      device_name: device_name || null,
      ip_address: req.ip || req.socket.remoteAddress || null,
      last_activity: new Date(),
      expires_at: expiresAt,
    });

    const jeton = signerJeton(utilisateur.id, sessionId);

    activityLog.enregistrerAsync({
      userId: utilisateur.id,
      action: 'login',
      appName: 'hub',
      metadata: { contexte: 'inscription' },
    });

    await envoyerEmailNouvelleConnexion({
      destinataire: utilisateur.email,
      prenom: utilisateur.prenom,
      deviceName: req.body.device_name,
      ip: req.ip,
    });

    return res.status(201).json({
      message: 'Compte créé.',
      jeton,
      utilisateur: exposerUtilisateur(utilisateur),
      expire_session: expiresAt.toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}

async function connexion(req, res, next) {
  try {
    const parse = connexionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const { email, mot_de_passe, device_id, device_name } = parse.data;
    const emailNormalise = email.trim().toLowerCase();
    const ip = req.ip || req.socket.remoteAddress || '';

    if (tentatives.estBloque(emailNormalise, ip)) {
      return res.status(429).json({
        erreur:
          'Trop de tentatives. Réessayez dans 15 minutes ou utilisez la récupération de compte.',
      });
    }

    const utilisateur = await Utilisateur.findOne({
      where: { email: emailNormalise, deleted_at: null },
    });

    if (!utilisateur) {
      const bloque = tentatives.enregistrerEchec(emailNormalise, ip);
      return res.status(401).json({
        erreur: 'Identifiants incorrects.',
        ...(bloque ? { captcha_requis: true } : {}),
      });
    }

    const ok = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!ok) {
      const bloque = tentatives.enregistrerEchec(emailNormalise, ip);
      return res.status(401).json({
        erreur: 'Identifiants incorrects.',
        ...(bloque ? { captcha_requis: true } : {}),
      });
    }

    tentatives.reinitialiser(emailNormalise, ip);

    const sessionId = uuidv4();
    const expiresMs = dureeJetonVersMs(process.env.JWT_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresMs);

    await SessionActive.destroy({ where: { utilisateur_id: utilisateur.id } });

    await SessionActive.create({
      utilisateur_id: utilisateur.id,
      session_id: sessionId,
      device_id: device_id || null,
      device_name: device_name || null,
      ip_address: ip || null,
      last_activity: new Date(),
      expires_at: expiresAt,
    });

    const jeton = signerJeton(utilisateur.id, sessionId);

    activityLog.enregistrerAsync({
      userId: utilisateur.id,
      action: 'login',
      appName: 'hub',
      metadata: { contexte: 'connexion' },
    });

    await envoyerEmailNouvelleConnexion({
      destinataire: utilisateur.email,
      prenom: utilisateur.prenom,
      deviceName: device_name,
      ip,
    });

    return res.json({
      message: 'Connexion réussie.',
      jeton,
      utilisateur: exposerUtilisateur(utilisateur),
      expire_session: expiresAt.toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}

async function deconnexion(req, res, next) {
  try {
    if (req.utilisateur?.id) {
      activityLog.enregistrerAsync({
        userId: req.utilisateur.id,
        action: 'logout',
        appName: 'hub',
        metadata: {},
      });
    }
    if (req.sessionActive) {
      await req.sessionActive.destroy();
    }
    return res.json({ message: 'Déconnexion effectuée.' });
  } catch (err) {
    return next(err);
  }
}

async function moi(req, res) {
  return res.json({ utilisateur: exposerUtilisateur(req.utilisateur) });
}

function exposerUtilisateur(u) {
  return {
    id: u.id,
    email: u.email,
    prenom: u.prenom,
    nom: u.nom,
    type_utilisateur: u.type_utilisateur,
    ecole_id: u.ecole_id || null,
    created_at: u.created_at,
    onboarding_complete: Boolean(u.onboarding_complete),
    photo_url: u.photo_url || null,
    telephone: u.telephone || null,
    ville: u.ville || null,
    nom_club: u.nom_club || null,
  };
}

async function terminerOnboarding(req, res, next) {
  try {
    await req.utilisateur.update({ onboarding_complete: true });
    await req.utilisateur.reload();
    return res.json({
      message: 'Onboarding terminé.',
      utilisateur: exposerUtilisateur(req.utilisateur),
    });
  } catch (err) {
    return next(err);
  }
}

/** Acceptation des CGU / confidentialité — journalisée (premier tour guidé). */
async function accepterCgu(req, res, next) {
  try {
    const acceptedAt =
      typeof req.body?.accepted_at === 'string' && req.body.accepted_at
        ? req.body.accepted_at
        : new Date().toISOString();

    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'cgu_accepted',
      appName: 'hub',
      metadata: { accepted_at: acceptedAt },
    });

    return res.status(201).json({ message: 'Acceptation enregistrée.', accepted_at: acceptedAt });
  } catch (err) {
    return next(err);
  }
}

/** Demande reset MDP — réponse neutre pour ne pas révéler les comptes existants. */
async function demandeMotDePasseOublie(req, res, next) {
  try {
    const parse = demandeMotDePasseSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const emailNormalise = parse.data.email.trim().toLowerCase();
    const utilisateur = await Utilisateur.findOne({
      where: { email: emailNormalise, deleted_at: null },
    });

    if (utilisateur) {
      await ReinitialisationMdp.destroy({ where: { utilisateur_id: utilisateur.id } });

      const jetonClair = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(jetonClair).digest('hex');
      const expire = new Date(Date.now() + 15 * 60 * 1000);

      await ReinitialisationMdp.create({
        utilisateur_id: utilisateur.id,
        token_hash: tokenHash,
        expires_at: expire,
      });

      await envoyerEmailReinitialisationMotDePasse({
        destinataire: utilisateur.email,
        prenom: utilisateur.prenom,
        jetonClair,
      });
    }

    return res.json({
      message:
        'Si un compte correspond à cet e-mail, vous recevrez un lien de réinitialisation.',
    });
  } catch (err) {
    return next(err);
  }
}

async function confirmerMotDePasse(req, res, next) {
  try {
    const parse = confirmerMotDePasseSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(parse.data.token)
      .digest('hex');

    const ligne = await ReinitialisationMdp.findOne({
      where: { token_hash: tokenHash, used_at: null },
    });

    if (!ligne || new Date(ligne.expires_at) < new Date()) {
      return res.status(400).json({
        erreur: 'Lien invalide ou expiré. Demandez un nouveau mot de passe.',
      });
    }

    const hash = await bcrypt.hash(parse.data.mot_de_passe, SALT_ROUNDS);
    const utilisateur = await Utilisateur.findByPk(ligne.utilisateur_id);
    if (!utilisateur || utilisateur.deleted_at) {
      return res.status(400).json({ erreur: 'Compte introuvable.' });
    }

    await utilisateur.update({ mot_de_passe: hash });
    await ligne.update({ used_at: new Date() });
    await SessionActive.destroy({ where: { utilisateur_id: utilisateur.id } });

    return res.json({ message: 'Mot de passe mis à jour. Reconnectez-vous.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  inscription,
  connexion,
  deconnexion,
  moi,
  terminerOnboarding,
  accepterCgu,
  demandeMotDePasseOublie,
  confirmerMotDePasse,
};
