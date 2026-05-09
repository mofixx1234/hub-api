/**
 * Matchs et stats joueurs — données isolées par entraîneur.
 */
const { Match, LigneStatMatch, Joueur } = require('../models');
const activityLog = require('../services/activityLog.service');
const { z } = require('zod');

const matchCreerSchema = z.object({
  joue_le: z.string().min(8),
  adversaire: z.string().min(1).max(200),
  lieu: z.string().max(255).optional().nullable(),
  score_pour: z.coerce.number().int().optional().nullable(),
  score_contre: z.coerce.number().int().optional().nullable(),
});

const lignesSchema = z.object({
  lignes: z
    .array(
      z.object({
        joueur_id: z.string().uuid(),
        points: z.coerce.number().int().min(0).max(200).optional().default(0),
        passes: z.coerce.number().int().min(0).max(200).optional().default(0),
        rebonds: z.coerce.number().int().min(0).max(200).optional().default(0),
        minutes_jeu: z.coerce.number().int().min(0).max(80).optional().nullable(),
      })
    )
    .min(1),
});

async function chargerMatchPourCoach(matchId, coachId) {
  return Match.findOne({
    where: { id: matchId, utilisateur_id: coachId, deleted_at: null },
  });
}

async function assertJoueurDuCoach(joueurId, coachId) {
  const j = await Joueur.findOne({
    where: { id: joueurId, utilisateur_id: coachId, deleted_at: null },
  });
  return Boolean(j);
}

async function listerMatchs(req, res, next) {
  try {
    const liste = await Match.findAll({
      where: { utilisateur_id: req.utilisateur.id, deleted_at: null },
      order: [['joue_le', 'DESC']],
    });
    return res.json({
      matchs: liste.map((m) => ({
        id: m.id,
        joue_le: m.joue_le,
        adversaire: m.adversaire,
        lieu: m.lieu,
        score_pour: m.score_pour,
        score_contre: m.score_contre,
        created_at: m.created_at,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function creerMatch(req, res, next) {
  try {
    const parse = matchCreerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const m = await Match.create({
      utilisateur_id: req.utilisateur.id,
      joue_le: parse.data.joue_le,
      adversaire: parse.data.adversaire.trim(),
      lieu: parse.data.lieu?.trim() || null,
      score_pour: parse.data.score_pour ?? null,
      score_contre: parse.data.score_contre ?? null,
    });
    return res.status(201).json({
      match: {
        id: m.id,
        joue_le: m.joue_le,
        adversaire: m.adversaire,
        lieu: m.lieu,
        score_pour: m.score_pour,
        score_contre: m.score_contre,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function detailMatch(req, res, next) {
  try {
    const m = await chargerMatchPourCoach(req.params.id, req.utilisateur.id);
    if (!m) return res.status(404).json({ erreur: 'Match introuvable.' });

    const lignes = await LigneStatMatch.findAll({
      where: { match_id: m.id, deleted_at: null },
    });
    const idsJoueurs = [...new Set(lignes.map((l) => l.joueur_id))];
    const joueurs =
      idsJoueurs.length > 0
        ? await Joueur.findAll({ where: { id: idsJoueurs } })
        : [];
    const jmap = new Map(joueurs.map((j) => [j.id, j]));

    return res.json({
      match: {
        id: m.id,
        joue_le: m.joue_le,
        adversaire: m.adversaire,
        lieu: m.lieu,
        score_pour: m.score_pour,
        score_contre: m.score_contre,
      },
      lignes: lignes.map((l) => ({
        id: l.id,
        joueur_id: l.joueur_id,
        nom_joueur: jmap.get(l.joueur_id)?.nom ?? null,
        points: l.points,
        passes: l.passes,
        rebonds: l.rebonds,
        minutes_jeu: l.minutes_jeu,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function modifierMatch(req, res, next) {
  try {
    const parse = matchCreerSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const m = await chargerMatchPourCoach(req.params.id, req.utilisateur.id);
    if (!m) return res.status(404).json({ erreur: 'Match introuvable.' });

    await m.update({
      ...(parse.data.joue_le !== undefined ? { joue_le: parse.data.joue_le } : {}),
      ...(parse.data.adversaire !== undefined ? { adversaire: parse.data.adversaire.trim() } : {}),
      ...(parse.data.lieu !== undefined ? { lieu: parse.data.lieu?.trim() || null } : {}),
      ...(parse.data.score_pour !== undefined ? { score_pour: parse.data.score_pour } : {}),
      ...(parse.data.score_contre !== undefined ? { score_contre: parse.data.score_contre } : {}),
    });

    return res.json({ message: 'Match mis à jour.' });
  } catch (err) {
    return next(err);
  }
}

async function supprimerMatch(req, res, next) {
  try {
    const m = await chargerMatchPourCoach(req.params.id, req.utilisateur.id);
    if (!m) return res.status(404).json({ erreur: 'Match introuvable.' });
    await m.update({ deleted_at: new Date() });
    await LigneStatMatch.update(
      { deleted_at: new Date() },
      { where: { match_id: m.id, deleted_at: null } }
    );
    return res.json({ message: 'Match archivé.' });
  } catch (err) {
    return next(err);
  }
}

async function enregistrerLignes(req, res, next) {
  try {
    const parse = lignesSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }

    const m = await chargerMatchPourCoach(req.params.id, req.utilisateur.id);
    if (!m) return res.status(404).json({ erreur: 'Match introuvable.' });

    for (const ligne of parse.data.lignes) {
      const ok = await assertJoueurDuCoach(ligne.joueur_id, req.utilisateur.id);
      if (!ok) {
        return res.status(400).json({ erreur: `Joueur ${ligne.joueur_id} invalide.` });
      }
    }

    for (const ligne of parse.data.lignes) {
      const exist = await LigneStatMatch.findOne({
        where: { match_id: m.id, joueur_id: ligne.joueur_id, deleted_at: null },
      });
      if (exist) {
        await exist.update({
          points: ligne.points,
          passes: ligne.passes,
          rebonds: ligne.rebonds,
          minutes_jeu: ligne.minutes_jeu ?? null,
        });
      } else {
        await LigneStatMatch.create({
          match_id: m.id,
          joueur_id: ligne.joueur_id,
          points: ligne.points,
          passes: ligne.passes,
          rebonds: ligne.rebonds,
          minutes_jeu: ligne.minutes_jeu ?? null,
        });
      }
    }

    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'save',
      appName: 'sport_stats',
      metadata: { entity: 'lignes_stats_match', match_id: m.id },
    });

    return res.json({ message: 'Statistiques enregistrées.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listerMatchs,
  creerMatch,
  detailMatch,
  modifierMatch,
  supprimerMatch,
  enregistrerLignes,
};
