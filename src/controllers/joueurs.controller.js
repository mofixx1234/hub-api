/**
 * CRUD joueurs — réservé à l’entraîneur propriétaire + abonnement « Gestion équipe ».
 */
const { Op } = require('sequelize');
const { Joueur } = require('../models');
const { joueurCreerSchema, joueurModifierSchema } = require('../utils/validation.joueurs');
const activityLog = require('../services/activityLog.service');

function exposerJoueur(j) {
  return {
    id: j.id,
    nom: j.nom,
    numero: j.numero,
    position: j.position,
    photo_url: j.photo_url,
    abonnement_id: j.abonnement_id,
    created_at: j.created_at,
  };
}

async function lister(req, res, next) {
  try {
    const liste = await Joueur.findAll({
      where: { utilisateur_id: req.utilisateur.id, deleted_at: null },
      order: [['nom', 'ASC']],
    });
    return res.json({ joueurs: liste.map(exposerJoueur) });
  } catch (err) {
    return next(err);
  }
}

async function creer(req, res, next) {
  try {
    const parse = joueurCreerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const abId = req.abonnementPrincipalPourApp?.id || null;

    const j = await Joueur.create({
      utilisateur_id: req.utilisateur.id,
      abonnement_id: abId,
      nom: parse.data.nom.trim(),
      numero: parse.data.numero ?? null,
      position: parse.data.position?.trim() || null,
      photo_url: parse.data.photo_url || null,
    });

    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'save',
      appName: 'gestion_sport',
      metadata: { entity: 'joueur', id: j.id },
    });

    return res.status(201).json({ joueur: exposerJoueur(j) });
  } catch (err) {
    return next(err);
  }
}

async function modifier(req, res, next) {
  try {
    const parse = joueurModifierSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        erreur: 'Données invalides',
        details: parse.error.flatten(),
      });
    }

    const j = await Joueur.findOne({
      where: {
        id: req.params.id,
        utilisateur_id: req.utilisateur.id,
        deleted_at: null,
      },
    });

    if (!j) {
      return res.status(404).json({ erreur: 'Joueur introuvable.' });
    }

    await j.update({
      ...(parse.data.nom !== undefined ? { nom: parse.data.nom.trim() } : {}),
      ...(parse.data.numero !== undefined ? { numero: parse.data.numero } : {}),
      ...(parse.data.position !== undefined
        ? { position: parse.data.position?.trim() || null }
        : {}),
      ...(parse.data.photo_url !== undefined
        ? { photo_url: parse.data.photo_url || null }
        : {}),
    });

    return res.json({ joueur: exposerJoueur(j) });
  } catch (err) {
    return next(err);
  }
}

async function supprimer(req, res, next) {
  try {
    const j = await Joueur.findOne({
      where: {
        id: req.params.id,
        utilisateur_id: req.utilisateur.id,
        deleted_at: null,
      },
    });
    if (!j) {
      return res.status(404).json({ erreur: 'Joueur introuvable.' });
    }
    await j.update({ deleted_at: new Date() });
    return res.json({ message: 'Joueur placé en corbeille (30 j).' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { lister, creer, modifier, supprimer };
