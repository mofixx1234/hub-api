/**
 * Vérifie JWT + session serveur active (single session).
 */
const { verifierJeton } = require('../utils/jwt');
const { Utilisateur, SessionActive } = require('../models');
const { Op } = require('sequelize');

async function exigerAuthentification(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ erreur: 'Authentification requise.' });
    }

    const token = header.slice(7);

    let payload;
    try {
      payload = verifierJeton(token);
    } catch {
      return res.status(401).json({ erreur: 'Jeton invalide ou expiré.' });
    }

    const utilisateurId = payload.sub;
    const sessionId = payload.sid;

    if (!utilisateurId || !sessionId) {
      return res.status(401).json({ erreur: 'Jeton mal formé.' });
    }

    const session = await SessionActive.findOne({
      where: {
        utilisateur_id: utilisateurId,
        session_id: sessionId,
        deleted_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: Utilisateur,
          as: 'utilisateur',
          required: true,
          where: { deleted_at: null },
        },
      ],
    });

    if (!session || !session.utilisateur || session.utilisateur.deleted_at) {
      return res.status(401).json({ erreur: 'Session révoquée ou expirée.' });
    }

    session.last_activity = new Date();
    await session.save({ fields: ['last_activity'] });

    req.utilisateur = session.utilisateur;
    req.sessionActive = session;

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { exigerAuthentification };
