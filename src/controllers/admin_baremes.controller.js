/**
 * Administration des barèmes (global CI + barème par école).
 */
const { z } = require('zod');
const { Ecole, ConfigGlobale, ActivityLog } = require('../models');
const {
  CLE_BAREMES,
  invaliderCacheBaremesCi,
} = require('../services/bareme_ci_config.service');

const majCiSchema = z.object({
  valeur: z.record(z.any()),
  confirmer_impact: z.literal(true),
});

async function resume(req, res, next) {
  try {
    const row = await ConfigGlobale.findOne({ where: { cle: CLE_BAREMES } });
    const ecoles = await Ecole.findAll({
      where: { deleted_at: null },
      attributes: ['id', 'nom', 'baremes'],
      order: [['nom', 'ASC']],
    });
    return res.json({
      baremes_ci: {
        cle: CLE_BAREMES,
        description: row?.description ?? null,
        valeur: row?.valeur ?? null,
        updated_at: row?.updated_at ?? null,
      },
      ecoles: ecoles.map((e) => ({
        id: e.id,
        nom: e.nom,
        baremes: e.baremes,
      })),
      avertissement:
        'Modifier un barème n’affecte que les nouvelles notes calculées après la modification.',
    });
  } catch (err) {
    return next(err);
  }
}

async function mettreAJourBaremesCi(req, res, next) {
  try {
    const parse = majCiSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }

    const row = await ConfigGlobale.findOne({ where: { cle: CLE_BAREMES } });
    const ancien = row?.valeur ? JSON.parse(JSON.stringify(row.valeur)) : null;
    const now = new Date();

    if (row) {
      await row.update({
        valeur: parse.data.valeur,
        updated_at: now,
      });
    } else {
      await ConfigGlobale.create({
        cle: CLE_BAREMES,
        valeur: parse.data.valeur,
        description: 'Barèmes EPS BAC — programme ivoirien (MENA-CI).',
        updated_at: now,
      });
    }

    invaliderCacheBaremesCi();

    await ActivityLog.create({
      user_id: req.utilisateur.id,
      action: 'bareme_update',
      app_name: 'admin',
      metadata: {
        cible: 'baremes_ci_officiel',
        ancienne_version: ancien,
        nouvelle_version: parse.data.valeur,
      },
    });

    return res.json({ message: 'Barème CI enregistré.', cle: CLE_BAREMES });
  } catch (err) {
    return next(err);
  }
}

async function mettreAJourBaremesEcole(req, res, next) {
  try {
    const parse = z
      .object({
        baremes: z.record(z.any()),
        confirmer_impact: z.literal(true),
      })
      .safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }

    const ecole = await Ecole.findOne({
      where: { id: req.params.ecoleId, deleted_at: null },
    });
    if (!ecole) return res.status(404).json({ erreur: 'École introuvable.' });

    const ancien = ecole.baremes ? JSON.parse(JSON.stringify(ecole.baremes)) : null;

    await ecole.update({ baremes: parse.data.baremes });

    await ActivityLog.create({
      user_id: req.utilisateur.id,
      action: 'bareme_update',
      app_name: 'admin',
      metadata: {
        cible: 'ecole_baremes',
        ecole_id: ecole.id,
        ancienne_version: ancien,
        nouvelle_version: parse.data.baremes,
      },
    });

    return res.json({ message: 'Barème école enregistré.', ecole_id: ecole.id });
  } catch (err) {
    return next(err);
  }
}

async function historique(req, res, next) {
  try {
    const logs = await ActivityLog.findAll({
      where: { action: 'bareme_update' },
      order: [['created_at', 'DESC']],
      limit: 100,
      attributes: ['id', 'user_id', 'metadata', 'created_at'],
    });
    return res.json({
      modifications: logs.map((l) => ({
        id: l.id,
        user_id: l.user_id,
        metadata: l.metadata,
        created_at: l.created_at,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  resume,
  mettreAJourBaremesCi,
  mettreAJourBaremesEcole,
  historique,
};
