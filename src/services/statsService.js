/**
 * Agrégations analytics — admin central, école, perso.
 */
const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database');
const {
  Paiement,
  Abonnement,
  Utilisateur,
  ActivityLog,
  Joueur,
  EpsEleve,
  EpsBacLigne,
  EpsClasseNotation,
  LigneStatMatch,
  Match,
} = require('../models');

function debutDuMois(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function debutDuJour(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function finDuJour(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return x;
}

async function revenueSomme({ depuis, jusquA }) {
  const row = await Paiement.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('montant')), 0), 'total']],
    where: {
      statut: 'success',
      deleted_at: null,
      date_paiement: { [Op.between]: [depuis, jusquA] },
    },
    raw: true,
  });
  return Number(row?.total ?? 0);
}

async function revenueCeMois() {
  const depuis = debutDuMois();
  const jusquA = new Date();
  return revenueSomme({ depuis, jusquA });
}

async function revenueCeJour() {
  const depuis = debutDuJour();
  const jusquA = finDuJour();
  return revenueSomme({ depuis, jusquA });
}

/** 30 derniers jours calendaires (jour plein). */
async function revenueParJour30() {
  const result = [];
  const aujourd = debutDuJour();
  for (let i = 29; i >= 0; i--) {
    const jour = new Date(aujourd);
    jour.setDate(jour.getDate() - i);
    const dep = debutDuJour(jour);
    const fin = finDuJour(jour);
    const montant = await revenueSomme({ depuis: dep, jusquA: fin });
    result.push({
      date: jour.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      montant: Math.round(montant),
    });
  }
  return result;
}

async function abonnementsActifsParRubrique() {
  const maintenant = new Date();
  const rows = await Abonnement.findAll({
    attributes: ['rubrique', [fn('COUNT', col('id')), 'nombre']],
    where: {
      statut: 'actif',
      deleted_at: null,
      date_fin: { [Op.gte]: maintenant },
    },
    group: ['rubrique'],
    raw: true,
  });
  return rows.map((r) => ({
    name: r.rubrique,
    value: Number(r.nombre),
  }));
}

async function nouveauxUtilisateursCetteSemaine() {
  const ilYA7 = new Date();
  ilYA7.setDate(ilYA7.getDate() - 7);
  return Utilisateur.count({
    where: {
      deleted_at: null,
      created_at: { [Op.gte]: ilYA7 },
    },
  });
}

async function metriquesChurnEtRenouvellement30j() {
  const maintenant = new Date();
  const debut30 = new Date(maintenant);
  debut30.setDate(debut30.getDate() - 30);

  const expires30 = await Abonnement.count({
    where: {
      statut: 'expire',
      deleted_at: null,
      date_fin: { [Op.between]: [debut30, maintenant] },
    },
  });

  const finsPeriode = await Abonnement.count({
    where: {
      deleted_at: null,
      date_fin: { [Op.between]: [debut30, maintenant] },
    },
  });

  const churn_pct = finsPeriode > 0 ? Math.round((expires30 / finsPeriode) * 1000) / 10 : 0;

  const renSel = await sequelize.query(
    `
    SELECT COUNT(DISTINCT u.id)::int AS nb
    FROM utilisateurs u
    INNER JOIN abonnements ex
      ON ex.utilisateur_id = u.id AND ex.statut = 'expire' AND ex.date_fin >= :depuis AND ex.date_fin <= :maintenant AND ex.deleted_at IS NULL
    INNER JOIN abonnements ac
      ON ac.utilisateur_id = u.id AND ac.statut = 'actif' AND ac.date_debut >= ex.date_fin AND ac.deleted_at IS NULL
    `,
    {
      replacements: { depuis: debut30, maintenant },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const renouveles = renSel?.[0]?.nb ?? 0;
  const renewal_pct =
    expires30 > 0 ? Math.round((renouveles / expires30) * 1000) / 10 : renouveles > 0 ? 100 : 0;

  return { churn_pct, renewal_pct, expires30, fins_periode: finsPeriode };
}

/** 8 dernières semaines glissantes : nouveaux comptes vs abonnements passés expire dans la semaine. */
async function croissanceUtilisateurs8Semaines() {
  const maintenant = debutDuJour();
  const result = [];
  for (let s = 7; s >= 0; s--) {
    const finSem = new Date(maintenant);
    finSem.setDate(finSem.getDate() - s * 7);
    const debutSem = new Date(finSem);
    debutSem.setDate(debutSem.getDate() - 6);
    debutSem.setHours(0, 0, 0, 0);
    finSem.setHours(23, 59, 59, 999);

    const nouveaux = await Utilisateur.count({
      where: {
        deleted_at: null,
        created_at: { [Op.between]: [debutSem, finSem] },
      },
    });

    const churn = await Abonnement.count({
      where: {
        deleted_at: null,
        statut: 'expire',
        date_fin: { [Op.between]: [debutSem, finSem] },
      },
    });

    result.push({
      semaine: `S${8 - s}`,
      periode: `${debutSem.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
      nouveaux,
      churn,
    });
  }
  return result;
}

async function utilisationAppsGlobale({ limit = 12 } = {}) {
  const rows = await ActivityLog.findAll({
    attributes: ['app_name', [fn('COUNT', col('id')), 'sessions']],
    where: {
      action: 'app_access',
      app_name: { [Op.ne]: null },
      created_at: { [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
    group: ['app_name'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit,
    raw: true,
  });
  return rows.map((r) => ({
    app: libellerAppPourGraph(r.app_name),
    sessions: Number(r.sessions),
    code: r.app_name,
  }));
}

function libellerAppPourGraph(code) {
  const map = {
    sport_stats: 'Stats sport',
    gestion_sport: 'Gestion équipe',
    eps_ci: 'EPS CI',
    eps_jv: 'EPS Jules Verne',
    hub: 'Hub',
  };
  return map[code] || code || 'Autre';
}

async function idsUtilisateursEcole(ecoleId) {
  const rows = await Utilisateur.findAll({
    attributes: ['id'],
    where: { ecole_id: ecoleId, deleted_at: null },
    raw: true,
  });
  return rows.map((r) => r.id);
}

async function statsEcole(ecoleId) {
  const ids = await idsUtilisateursEcole(ecoleId);
  const depuis = debutDuMois();

  if (ids.length === 0) {
    return {
      nb_profs_actifs: 0,
      total_depense_mois_fcfa: 0,
      sessions_par_app: [],
      prof_plus_actif: null,
      taux_utilisation_pct: 0,
      profs_connectes_mois: 0,
    };
  }

  const nbProfs = await Utilisateur.count({
    where: {
      ecole_id: ecoleId,
      deleted_at: null,
      type_utilisateur: { [Op.in]: ['prof_eps', 'entraineur'] },
    },
  });

  const totalDepenseMois = await Paiement.sum('montant', {
    where: {
      statut: 'success',
      deleted_at: null,
      date_paiement: { [Op.gte]: depuis },
      utilisateur_id: { [Op.in]: ids },
    },
  });

  const sessionsParApp = await ActivityLog.findAll({
    attributes: ['app_name', [fn('COUNT', col('id')), 'sessions']],
    where: {
      action: 'app_access',
      user_id: { [Op.in]: ids },
      created_at: { [Op.gte]: depuis },
    },
    group: ['app_name'],
    raw: true,
  });

  const loginsParProf = await ActivityLog.findAll({
    attributes: ['user_id', [fn('COUNT', col('id')), 'logins']],
    where: {
      action: 'login',
      user_id: { [Op.in]: ids },
      created_at: { [Op.gte]: depuis },
    },
    group: ['user_id'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 1,
    raw: true,
  });

  let profPlusActif = null;
  if (loginsParProf.length && loginsParProf[0].user_id) {
    const u = await Utilisateur.findByPk(loginsParProf[0].user_id, {
      attributes: ['id', 'prenom', 'nom', 'email'],
    });
    if (u) {
      profPlusActif = {
        ...u.get({ plain: true }),
        logins: Number(loginsParProf[0].logins),
      };
    }
  }

  const profsLoginRows = await sequelize.query(
    `
    SELECT COUNT(DISTINCT user_id)::int AS c
    FROM activity_logs
    WHERE action = 'login'
      AND user_id IN (:ids)
      AND created_at >= :depuis
    `,
    {
      replacements: { ids, depuis },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  const profsAyantLogin = profsLoginRows?.[0]?.c ?? 0;

  const taux_utilisation_pct =
    nbProfs > 0 ? Math.round((profsAyantLogin / nbProfs) * 1000) / 10 : 0;

  return {
    nb_profs_actifs: nbProfs,
    total_depense_mois_fcfa: Number(totalDepenseMois || 0),
    sessions_par_app: sessionsParApp.map((r) => ({
      app: r.app_name,
      sessions: Number(r.sessions),
    })),
    prof_plus_actif: profPlusActif,
    taux_utilisation_pct,
    profs_connectes_mois: profsAyantLogin,
  };
}

const DUREE_SESSION_MIN_ESTIMEE = 25;

async function statsPerso(utilisateurId) {
  const debutM = debutDuMois();

  const loginsMois = await ActivityLog.count({
    where: {
      user_id: utilisateurId,
      action: 'login',
      created_at: { [Op.gte]: debutM },
    },
  });

  const temps_total_estime_min = loginsMois * DUREE_SESSION_MIN_ESTIMEE;

  const appsRows = await ActivityLog.findAll({
    attributes: ['app_name', [fn('COUNT', col('id')), 'nb']],
    where: {
      user_id: utilisateurId,
      action: 'app_access',
      app_name: { [Op.ne]: null },
      created_at: { [Op.gte]: debutM },
    },
    group: ['app_name'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 1,
    raw: true,
  });

  const app_preferee = appsRows.length
    ? { code: appsRows[0].app_name, label: libellerAppPourGraph(appsRows[0].app_name) }
    : null;

  const nbJoueurs = await Joueur.count({
    where: { utilisateur_id: utilisateurId, deleted_at: null },
  });
  const nbMatchs = await Match.count({
    where: { utilisateur_id: utilisateurId, deleted_at: null },
  });

  const mids = await Match.findAll({
    attributes: ['id'],
    where: { utilisateur_id: utilisateurId, deleted_at: null },
    raw: true,
  });
  const midList = mids.map((m) => m.id);
  const nbLignesStats =
    midList.length > 0
      ? await LigneStatMatch.count({
          where: { match_id: { [Op.in]: midList }, deleted_at: null },
        })
      : 0;

  const nbEpsEleves = await EpsEleve.count({
    where: { utilisateur_id: utilisateurId, deleted_at: null },
  });

  const eids = await EpsEleve.findAll({
    attributes: ['id'],
    where: { utilisateur_id: utilisateurId, deleted_at: null },
    raw: true,
  });
  const eidList = eids.map((r) => r.id);
  const nbEpsBac =
    eidList.length > 0
      ? await EpsBacLigne.count({
          where: { eleve_id: { [Op.in]: eidList }, deleted_at: null },
        })
      : 0;
  const nbEpsClasse =
    eidList.length > 0
      ? await EpsClasseNotation.count({
          where: { eleve_id: { [Op.in]: eidList }, deleted_at: null },
        })
      : 0;

  const exportsEffectues = await ActivityLog.count({
    where: { user_id: utilisateurId, action: 'export', created_at: { [Op.gte]: debutM } },
  });

  return {
    logins_ce_mois: loginsMois,
    temps_total_estime_min,
    app_la_plus_utilisee: app_preferee,
    donnees_saisies: {
      joueurs: nbJoueurs,
      matchs: nbMatchs,
      lignes_stats_match: nbLignesStats,
      eps_eleves: nbEpsEleves,
      eps_bac_lignes: nbEpsBac,
      eps_classe_notations: nbEpsClasse,
    },
    exports_effectues: exportsEffectues,
  };
}

async function kpisAdminDashboard() {
  const [revMois, revJour, nouvSemaine, churnData] = await Promise.all([
    revenueCeMois(),
    revenueCeJour(),
    nouveauxUtilisateursCetteSemaine(),
    metriquesChurnEtRenouvellement30j(),
  ]);

  const abonnements_par_rubrique = await abonnementsActifsParRubrique();

  return {
    revenue_mois_fcfa: Math.round(Number(revMois)),
    revenue_jour_fcfa: Math.round(Number(revJour)),
    nouveaux_utilisateurs_7j: nouvSemaine,
    churn_pct_30j: churnData.churn_pct,
    renewal_pct_30j: churnData.renewal_pct,
    abonnements_actifs_par_rubrique: abonnements_par_rubrique,
  };
}

module.exports = {
  revenueCeMois,
  revenueCeJour,
  revenueParJour30,
  abonnementsActifsParRubrique,
  nouveauxUtilisateursCetteSemaine,
  metriquesChurnEtRenouvellement30j,
  croissanceUtilisateurs8Semaines,
  utilisationAppsGlobale,
  statsEcole,
  statsPerso,
  kpisAdminDashboard,
  libellerAppPourGraph,
};
