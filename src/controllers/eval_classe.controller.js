/**
 * API Évaluation classe EPS (contrôle continu) — classes, séances, notes, moyennes.
 */
const { Op } = require('sequelize');
const {
  ClasseEval,
  EleveClasse,
  SeanceEvalClasse,
  NoteClasseEval,
} = require('../models');
const {
  classeCreateSchema,
  classePatchSchema,
  eleveSchema,
  seanceSchema,
  notesBulkSchema,
} = require('../utils/validation.eval_classe');

function mention(moy) {
  if (moy == null || Number.isNaN(moy)) return '—';
  if (moy >= 16) return 'Très Bien';
  if (moy >= 14) return 'Bien';
  if (moy >= 12) return 'Assez Bien';
  if (moy >= 10) return 'Passable';
  return 'Insuffisant';
}

async function syncNombreEleves(classeId) {
  const n = await EleveClasse.count({
    where: { classe_id: classeId, deleted_at: null },
  });
  await ClasseEval.update({ nombre_eleves: n }, { where: { id: classeId } });
}

async function classeProprietaire(userId, classeId) {
  return ClasseEval.findOne({
    where: { id: classeId, user_id: userId, deleted_at: null },
  });
}

/** Moyenne pondérée par coefficients (élève présent, note saisie). */
async function moyenneTrimestreEleve(eleveId, classeId, trimestre) {
  const seances = await SeanceEvalClasse.findAll({
    where: { classe_id: classeId, trimestre, deleted_at: null },
    include: [
      {
        model: NoteClasseEval,
        as: 'notes',
        where: { eleve_id: eleveId },
        required: false,
      },
    ],
  });

  let sum = 0;
  let coefSum = 0;
  for (const s of seances) {
    const ligne = (s.notes && s.notes[0]) || null;
    if (!ligne || ligne.absent || ligne.note == null) continue;
    const c = Number(s.coefficient);
    sum += Number(ligne.note) * c;
    coefSum += c;
  }
  if (coefSum === 0) return null;
  return sum / coefSum;
}

async function moyenneAnnuelleEleve(eleveId, classeId) {
  const t1 = await moyenneTrimestreEleve(eleveId, classeId, 'T1');
  const t2 = await moyenneTrimestreEleve(eleveId, classeId, 'T2');
  const t3 = await moyenneTrimestreEleve(eleveId, classeId, 'T3');
  const vals = [t1, t2, t3].filter((v) => v != null);
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
}

async function dashboard(req, res, next) {
  try {
    const uid = req.utilisateur.id;
    const classes = await ClasseEval.findAll({
      where: { user_id: uid, deleted_at: null },
      order: [['annee_scolaire', 'DESC'], ['nom', 'ASC']],
    });

    const debut = new Date();
    debut.setDate(1);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setMonth(fin.getMonth() + 1);
    const dsDebut = debut.toISOString().slice(0, 10);
    const dsFin = fin.toISOString().slice(0, 10);

    const seancesMois = await SeanceEvalClasse.findAll({
      where: {
        user_id: uid,
        deleted_at: null,
        [Op.and]: [{ date_seance: { [Op.gte]: dsDebut } }, { date_seance: { [Op.lt]: dsFin } }],
      },
      attributes: ['id', 'classe_id', 'date_seance', 'titre'],
    });

    let seancesSansNotes = 0;
    for (const s of seancesMois) {
      const nb = await NoteClasseEval.count({ where: { seance_id: s.id } });
      if (nb === 0) seancesSansNotes += 1;
    }

    const aujourd = new Date().toISOString().slice(0, 10);
    const prochaine = await SeanceEvalClasse.findOne({
      where: {
        user_id: uid,
        deleted_at: null,
        date_seance: { [Op.gte]: aujourd },
      },
      order: [['date_seance', 'ASC'], ['created_at', 'ASC']],
      attributes: ['id', 'titre', 'date_seance', 'classe_id', 'trimestre'],
    });

    let prochainePayload = null;
    if (prochaine) {
      const cl = await ClasseEval.findByPk(prochaine.classe_id, {
        attributes: ['nom', 'annee_scolaire'],
      });
      prochainePayload = {
        id: prochaine.id,
        titre: prochaine.titre,
        date_seance: prochaine.date_seance,
        trimestre: prochaine.trimestre,
        classe: cl ? { nom: cl.nom, annee_scolaire: cl.annee_scolaire } : null,
      };
    }

    return res.json({
      classes: classes.map((c) => ({
        id: c.id,
        nom: c.nom,
        niveau: c.niveau,
        annee_scolaire: c.annee_scolaire,
        nombre_eleves: c.nombre_eleves,
      })),
      alertes: {
        seances_sans_notes_ce_mois: seancesSansNotes,
      },
      prochaine_seance: prochainePayload,
    });
  } catch (err) {
    return next(err);
  }
}

async function listeClasses(req, res, next) {
  try {
    const rows = await ClasseEval.findAll({
      where: { user_id: req.utilisateur.id, deleted_at: null },
      order: [['nom', 'ASC']],
    });
    return res.json({ classes: rows });
  } catch (err) {
    return next(err);
  }
}

async function creerClasse(req, res, next) {
  try {
    const parse = classeCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const c = await ClasseEval.create({
      user_id: req.utilisateur.id,
      nom: parse.data.nom.trim(),
      niveau: parse.data.niveau?.trim() || null,
      annee_scolaire: parse.data.annee_scolaire.trim(),
      nombre_eleves: 0,
    });
    return res.status(201).json({ classe: c });
  } catch (err) {
    return next(err);
  }
}

async function detailClasse(req, res, next) {
  try {
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });

    const eleves = await EleveClasse.findAll({
      where: { classe_id: c.id, deleted_at: null },
    });

    const moys = [];
    for (const e of eleves) {
      const ma = await moyenneAnnuelleEleve(e.id, c.id);
      moys.push({ eleve_id: e.id, nom: `${e.prenom} ${e.nom}`, moyenne_annuelle: ma });
    }
    const avecMoy = moys.filter((x) => x.moyenne_annuelle != null);
    let meilleur = null;
    let difficulte = null;
    if (avecMoy.length) {
      const tri = [...avecMoy].sort((a, b) => b.moyenne_annuelle - a.moyenne_annuelle);
      meilleur = tri[0];
      difficulte = tri[tri.length - 1];
    }

    let moyenneGeneraleClasse = null;
    if (avecMoy.length) {
      moyenneGeneraleClasse =
        avecMoy.reduce((s, x) => s + x.moyenne_annuelle, 0) / avecMoy.length;
    }

    return res.json({
      classe: c,
      statistiques: {
        moyenne_generale: moyenneGeneraleClasse,
        meilleur_eleve: meilleur,
        eleve_en_difficulte: difficulte,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function patchClasse(req, res, next) {
  try {
    const parse = classePatchSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });
    const maj = {};
    if (parse.data.nom != null) maj.nom = parse.data.nom.trim();
    if (parse.data.niveau !== undefined) maj.niveau = parse.data.niveau?.trim() || null;
    if (parse.data.annee_scolaire != null) maj.annee_scolaire = parse.data.annee_scolaire.trim();
    await c.update(maj);
    return res.json({ classe: c });
  } catch (err) {
    return next(err);
  }
}

async function supprimerClasse(req, res, next) {
  try {
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });
    await c.update({ deleted_at: new Date() });
    return res.json({ message: 'Classe archivée.' });
  } catch (err) {
    return next(err);
  }
}

async function listeEleves(req, res, next) {
  try {
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });
    const eleves = await EleveClasse.findAll({
      where: { classe_id: c.id, deleted_at: null },
      order: [['nom', 'ASC'], ['prenom', 'ASC']],
    });
    return res.json({ eleves });
  } catch (err) {
    return next(err);
  }
}

async function creerEleve(req, res, next) {
  try {
    const parse = eleveSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });
    const e = await EleveClasse.create({
      classe_id: c.id,
      user_id: req.utilisateur.id,
      nom: parse.data.nom.trim(),
      prenom: parse.data.prenom.trim(),
      numero_matricule: parse.data.numero_matricule?.trim() || null,
      sexe: parse.data.sexe,
    });
    await syncNombreEleves(c.id);
    return res.status(201).json({ eleve: e });
  } catch (err) {
    return next(err);
  }
}

async function patchEleve(req, res, next) {
  try {
    const parse = eleveSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const e = await EleveClasse.findOne({
      where: {
        id: req.params.eleveId,
        user_id: req.utilisateur.id,
        deleted_at: null,
      },
    });
    if (!e) return res.status(404).json({ erreur: 'Élève introuvable.' });
    await e.update({
      nom: parse.data.nom?.trim() ?? e.nom,
      prenom: parse.data.prenom?.trim() ?? e.prenom,
      numero_matricule:
        parse.data.numero_matricule !== undefined
          ? parse.data.numero_matricule?.trim() || null
          : e.numero_matricule,
      sexe: parse.data.sexe ?? e.sexe,
    });
    return res.json({ eleve: e });
  } catch (err) {
    return next(err);
  }
}

async function supprimerEleve(req, res, next) {
  try {
    const e = await EleveClasse.findOne({
      where: { id: req.params.eleveId, user_id: req.utilisateur.id, deleted_at: null },
    });
    if (!e) return res.status(404).json({ erreur: 'Élève introuvable.' });
    await e.update({ deleted_at: new Date() });
    await syncNombreEleves(e.classe_id);
    return res.json({ message: 'Élève retiré.' });
  } catch (err) {
    return next(err);
  }
}

async function creerSeance(req, res, next) {
  try {
    const parse = seanceSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });
    const s = await SeanceEvalClasse.create({
      user_id: req.utilisateur.id,
      classe_id: c.id,
      titre: parse.data.titre.trim(),
      date_seance: parse.data.date_seance,
      type_activite: parse.data.type_activite?.trim() || null,
      coefficient: parse.data.coefficient,
      trimestre: parse.data.trimestre,
    });
    return res.status(201).json({ seance: s });
  } catch (err) {
    return next(err);
  }
}

async function detailSeance(req, res, next) {
  try {
    const s = await SeanceEvalClasse.findOne({
      where: { id: req.params.seanceId, user_id: req.utilisateur.id, deleted_at: null },
      include: [{ model: NoteClasseEval, as: 'notes', required: false }],
    });
    if (!s) return res.status(404).json({ erreur: 'Séance introuvable.' });
    return res.json({ seance: s });
  } catch (err) {
    return next(err);
  }
}

async function enregistrerNotes(req, res, next) {
  try {
    const parse = notesBulkSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ erreur: 'Données invalides', details: parse.error.flatten() });
    }
    const s = await SeanceEvalClasse.findOne({
      where: { id: req.params.seanceId, user_id: req.utilisateur.id, deleted_at: null },
    });
    if (!s) return res.status(404).json({ erreur: 'Séance introuvable.' });

    const elevesIds = await EleveClasse.findAll({
      where: { classe_id: s.classe_id, deleted_at: null },
      attributes: ['id'],
    });
    const autorises = new Set(elevesIds.map((e) => e.id));

    for (const ligne of parse.data.lignes) {
      if (!autorises.has(ligne.eleve_id)) {
        return res.status(400).json({ erreur: `Élève non membre de la classe : ${ligne.eleve_id}` });
      }
      const absent = Boolean(ligne.absent);
      let note = ligne.note != null && ligne.note !== '' ? Number(ligne.note) : null;
      if (absent) note = null;
      if (note != null && (note < 0 || note > 20)) {
        return res.status(400).json({ erreur: 'Note entre 0 et 20.', eleve_id: ligne.eleve_id });
      }

      const [row, created] = await NoteClasseEval.findOrCreate({
        where: { seance_id: s.id, eleve_id: ligne.eleve_id },
        defaults: {
          seance_id: s.id,
          eleve_id: ligne.eleve_id,
          note,
          absent,
          observation: ligne.observation?.trim() || null,
        },
      });
      if (!created) {
        await row.update({
          note,
          absent,
          observation: ligne.observation?.trim() || null,
        });
      }
    }

    const updated = await NoteClasseEval.findAll({ where: { seance_id: s.id } });
    return res.json({ message: 'Notes enregistrées.', notes: updated });
  } catch (err) {
    return next(err);
  }
}

async function moyennesClasse(req, res, next) {
  try {
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });

    const eleves = await EleveClasse.findAll({
      where: { classe_id: c.id, deleted_at: null },
      order: [['nom', 'ASC']],
    });

    const lignes = [];
    for (const e of eleves) {
      const t1 = await moyenneTrimestreEleve(e.id, c.id, 'T1');
      const t2 = await moyenneTrimestreEleve(e.id, c.id, 'T2');
      const t3 = await moyenneTrimestreEleve(e.id, c.id, 'T3');
      const annuelle = await moyenneAnnuelleEleve(e.id, c.id);
      const arr = [t1, t2, t3].filter((v) => v != null);
      const moyenneSimple =
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

      lignes.push({
        eleve_id: e.id,
        nom: `${e.prenom} ${e.nom}`,
        T1: t1,
        T2: t2,
        T3: t3,
        moyenne_annuelle: moyenneSimple ?? annuelle,
        mention: mention(moyenneSimple ?? annuelle),
      });
    }

    return res.json({ classe_id: c.id, moyennes: lignes });
  } catch (err) {
    return next(err);
  }
}

async function bulletinEleve(req, res, next) {
  try {
    const e = await EleveClasse.findOne({
      where: { id: req.params.eleveId, user_id: req.utilisateur.id, deleted_at: null },
    });
    if (!e) return res.status(404).json({ erreur: 'Élève introuvable.' });

    const c = await ClasseEval.findByPk(e.classe_id);
    const trim = req.query.trimestre;

    const detailTrim = async (t) => {
      const seances = await SeanceEvalClasse.findAll({
        where: { classe_id: c.id, trimestre: t, deleted_at: null },
        order: [['date_seance', 'ASC']],
        include: [
          {
            model: NoteClasseEval,
            as: 'notes',
            where: { eleve_id: e.id },
            required: false,
          },
        ],
      });
      return seances.map((s) => {
        const n = s.notes && s.notes[0];
        return {
          seance_id: s.id,
          titre: s.titre,
          date: s.date_seance,
          coefficient: Number(s.coefficient),
          note: n && !n.absent ? Number(n.note) : null,
          absent: n ? n.absent : false,
          observation: n?.observation || null,
        };
      });
    };

    let parTrimestre;
    if (trim === 'T1' || trim === 'T2' || trim === 'T3') {
      parTrimestre = { [trim]: await detailTrim(trim) };
    } else {
      parTrimestre = {
        T1: await detailTrim('T1'),
        T2: await detailTrim('T2'),
        T3: await detailTrim('T3'),
      };
    }

    const mT1 = await moyenneTrimestreEleve(e.id, c.id, 'T1');
    const mT2 = await moyenneTrimestreEleve(e.id, c.id, 'T2');
    const mT3 = await moyenneTrimestreEleve(e.id, c.id, 'T3');
    const mAnn = await moyenneAnnuelleEleve(e.id, c.id);

    return res.json({
      eleve: { id: e.id, nom: e.nom, prenom: e.prenom, matricule: e.numero_matricule },
      classe: { nom: c.nom, niveau: c.niveau, annee_scolaire: c.annee_scolaire },
      trimestres: parTrimestre,
      moyennes: { T1: mT1, T2: mT2, T3: mT3, annuelle: mAnn },
      mention: mention(mAnn),
    });
  } catch (err) {
    return next(err);
  }
}

async function listeSeances(req, res, next) {
  try {
    const c = await classeProprietaire(req.utilisateur.id, req.params.classeId);
    if (!c) return res.status(404).json({ erreur: 'Classe introuvable.' });
    const rows = await SeanceEvalClasse.findAll({
      where: { classe_id: c.id, deleted_at: null },
      order: [['date_seance', 'DESC'], ['created_at', 'DESC']],
    });
    return res.json({ seances: rows });
  } catch (err) {
    return next(err);
  }
}

async function bulletinPdf(req, res, next) {
  try {
    const e = await EleveClasse.findOne({
      where: { id: req.params.eleveId, user_id: req.utilisateur.id, deleted_at: null },
    });
    if (!e) return res.status(404).json({ erreur: 'Élève introuvable.' });
    const c = await ClasseEval.findByPk(e.classe_id);

    const texte = [
      'BULLETIN EPS — Contrôle continu',
      `Élève : ${e.prenom} ${e.nom}`,
      `Classe : ${c.nom} — ${c.annee_scolaire}`,
      '',
      '(Export PDF complet — à brancher sur un moteur PDF en production.)',
      '',
      `Généré le ${new Date().toLocaleString('fr-FR')}`,
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bulletin-${e.id}.txt"`);
    return res.send(texte);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  dashboard,
  listeClasses,
  creerClasse,
  detailClasse,
  patchClasse,
  supprimerClasse,
  listeEleves,
  creerEleve,
  patchEleve,
  supprimerEleve,
  creerSeance,
  detailSeance,
  enregistrerNotes,
  moyennesClasse,
  bulletinEleve,
  bulletinPdf,
  listeSeances,
};
