/**
 * EPS — élèves BAC et notes de classe (scopes CI et Jules Verne).
 */
const { EpsEleve, EpsBacLigne, EpsClasseNotation } = require('../models');
const activityLog = require('../services/activityLog.service');
const { listeEpreuvesCatalogue } = require('../services/bareme_eps_ci');
const { calculerPointsBacCi } = require('../services/bareme_ci_config.service');
const { listeEpreuvesCatalogue: listeEpreuvesCatalogueJv } = require('../services/bareme_eps_jv');
const { z } = require('zod');

const eleveSchema = z.object({
  nom: z.string().min(1).max(120),
  prenom: z.string().min(1).max(120),
  classe: z.string().max(64).optional().nullable(),
  sexe: z.enum(['M', 'F']).optional().nullable(),
});

const bacLigneSchema = z.object({
  eleve_id: z.string().uuid(),
  code_epreuve: z.string().min(1).max(64),
  valeur_brute: z.coerce.number(),
});

const classeNotationSchema = z.object({
  eleve_id: z.string().uuid(),
  titre: z.string().min(1).max(200),
  note: z.coerce.number().min(0).max(20),
  periode: z.string().max(64).optional().nullable(),
  commentaire: z.string().optional().nullable(),
});

async function chargerEleveProf(eleveId, profId, scope) {
  return EpsEleve.findOne({
    where: { id: eleveId, utilisateur_id: profId, scope, deleted_at: null },
  });
}

async function listeEleves(req, res, next, scope) {
  try {
    const liste = await EpsEleve.findAll({
      where: { utilisateur_id: req.utilisateur.id, scope, deleted_at: null },
      order: [['nom', 'ASC']],
    });
    return res.json({
      eleves: liste.map((e) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        classe: e.classe,
        sexe: e.sexe,
        created_at: e.created_at,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function creerEleve(req, res, next, scope) {
  try {
    const parse = eleveSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const e = await EpsEleve.create({
      utilisateur_id: req.utilisateur.id,
      scope,
      ecole_id: null,
      nom: parse.data.nom.trim(),
      prenom: parse.data.prenom.trim(),
      classe: parse.data.classe?.trim() || null,
      sexe: parse.data.sexe ?? null,
    });
    return res.status(201).json({
      eleve: { id: e.id, nom: e.nom, prenom: e.prenom, classe: e.classe, sexe: e.sexe },
    });
  } catch (err) {
    return next(err);
  }
}

async function supprimerEleve(req, res, next, scope) {
  try {
    const e = await chargerEleveProf(req.params.id, req.utilisateur.id, scope);
    if (!e) return res.status(404).json({ erreur: 'Élève introuvable.' });
    await e.update({ deleted_at: new Date() });
    return res.json({ message: 'Élève archivé.' });
  } catch (err) {
    return next(err);
  }
}

async function listeLignesBac(req, res, next, scopeBac) {
  try {
    const eleve = await chargerEleveProf(req.params.eleveId, req.utilisateur.id, scopeBac);
    if (!eleve) return res.status(404).json({ erreur: 'Élève introuvable.' });

    const lignes = await EpsBacLigne.findAll({
      where: { eleve_id: eleve.id, deleted_at: null },
      order: [['created_at', 'DESC']],
    });

    return res.json({
      lignes: lignes.map((l) => ({
        id: l.id,
        code_epreuve: l.code_epreuve,
        valeur_brute: Number(l.valeur_brute),
        points_attribues: Number(l.points_attribues),
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function ajouterLigneBac(req, res, next, scopeBac) {
  try {
    const parse = bacLigneSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }

    const eleve = await chargerEleveProf(parse.data.eleve_id, req.utilisateur.id, scopeBac);
    if (!eleve) return res.status(404).json({ erreur: 'Élève introuvable.' });

    const sexePourBareme = eleve.sexe || 'M';
    const pts = await calculerPointsBacCi(
      parse.data.code_epreuve,
      parse.data.valeur_brute,
      sexePourBareme
    );

    const ligne = await EpsBacLigne.create({
      eleve_id: eleve.id,
      code_epreuve: parse.data.code_epreuve,
      valeur_brute: parse.data.valeur_brute,
      points_attribues: pts,
    });

    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'save',
      appName: scopeBac === 'bac_fr' ? 'eps_jv' : 'eps_ci',
      metadata: { entity: 'eps_bac_ligne', eleve_id: eleve.id },
    });

    return res.status(201).json({
      ligne: {
        id: ligne.id,
        code_epreuve: ligne.code_epreuve,
        valeur_brute: Number(ligne.valeur_brute),
        points_attribues: Number(ligne.points_attribues),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function catalogueEpreuves(req, res, next, programme) {
  const liste =
    programme === 'jv' ? listeEpreuvesCatalogueJv() : listeEpreuvesCatalogue();
  return res.json({ epreuves: liste });
}

async function listeNotationsClasse(req, res, next, scopeClasse) {
  try {
    const eleve = await chargerEleveProf(req.params.eleveId, req.utilisateur.id, scopeClasse);
    if (!eleve) return res.status(404).json({ erreur: 'Élève introuvable.' });

    const notes = await EpsClasseNotation.findAll({
      where: { eleve_id: eleve.id, deleted_at: null },
      order: [['created_at', 'DESC']],
    });

    return res.json({
      notations: notes.map((n) => ({
        id: n.id,
        titre: n.titre,
        note: Number(n.note),
        periode: n.periode,
        commentaire: n.commentaire,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function ajouterNotationClasse(req, res, next, scopeClasse) {
  try {
    const parse = classeNotationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }

    const eleve = await chargerEleveProf(parse.data.eleve_id, req.utilisateur.id, scopeClasse);
    if (!eleve) return res.status(404).json({ erreur: 'Élève introuvable.' });

    const n = await EpsClasseNotation.create({
      eleve_id: eleve.id,
      titre: parse.data.titre.trim(),
      note: parse.data.note,
      periode: parse.data.periode?.trim() || null,
      commentaire: parse.data.commentaire?.trim() || null,
    });

    activityLog.enregistrerAsync({
      userId: req.utilisateur.id,
      action: 'save',
      appName: scopeClasse === 'classe_fr' ? 'eps_jv' : 'eps_ci',
      metadata: { entity: 'eps_classe_notation', eleve_id: eleve.id },
    });

    return res.status(201).json({
      notation: {
        id: n.id,
        titre: n.titre,
        note: Number(n.note),
        periode: n.periode,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listeEleves,
  creerEleve,
  supprimerEleve,
  listeLignesBac,
  ajouterLigneBac,
  catalogueEpreuves,
  listeNotationsClasse,
  ajouterNotationClasse,
};
