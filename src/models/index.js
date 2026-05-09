const sequelize = require('../config/database');
const defineUtilisateur = require('./utilisateur');
const defineSessionActive = require('./session_active');
const defineApplication = require('./application');
const defineEcole = require('./ecole');
const defineAbonnement = require('./abonnement');
const definePaiement = require('./paiement');
const defineReinitialisationMdp = require('./reinitialisation_mdp');
const defineJoueur = require('./joueur');
const defineMatch = require('./match');
const defineLigneStatMatch = require('./ligne_stat_match');
const defineEpsEleve = require('./eps_eleve');
const defineEpsBacLigne = require('./eps_bac_ligne');
const defineEpsClasseNotation = require('./eps_classe_notation');
const defineActivityLog = require('./activity_log');
const defineAdminMeta = require('./admin_meta');
const defineUserPreference = require('./user_preference');
const defineClasseEval = require('./classe_eval');
const defineEleveClasse = require('./eleve_classe');
const defineSeanceEvalClasse = require('./seance_eval_classe');
const defineNoteClasseEval = require('./note_classe_eval');
const defineConfigGlobale = require('./config_globale');

const Utilisateur = defineUtilisateur(sequelize);
const SessionActive = defineSessionActive(sequelize);
const Application = defineApplication(sequelize);
const Ecole = defineEcole(sequelize);
const Abonnement = defineAbonnement(sequelize);
const Paiement = definePaiement(sequelize);
const ReinitialisationMdp = defineReinitialisationMdp(sequelize);
const Joueur = defineJoueur(sequelize);
const Match = defineMatch(sequelize);
const LigneStatMatch = defineLigneStatMatch(sequelize);
const EpsEleve = defineEpsEleve(sequelize);
const EpsBacLigne = defineEpsBacLigne(sequelize);
const EpsClasseNotation = defineEpsClasseNotation(sequelize);
const ActivityLog = defineActivityLog(sequelize);
const AdminMeta = defineAdminMeta(sequelize);
const UserPreference = defineUserPreference(sequelize);
const ClasseEval = defineClasseEval(sequelize);
const EleveClasse = defineEleveClasse(sequelize);
const SeanceEvalClasse = defineSeanceEvalClasse(sequelize);
const NoteClasseEval = defineNoteClasseEval(sequelize);
const ConfigGlobale = defineConfigGlobale(sequelize);

Utilisateur.hasMany(SessionActive, { foreignKey: 'utilisateur_id', as: 'sessions' });
SessionActive.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

Utilisateur.hasMany(Abonnement, { foreignKey: 'utilisateur_id', as: 'abonnements' });
Abonnement.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

Ecole.hasMany(Abonnement, { foreignKey: 'ecole_id', as: 'abonnements' });
Abonnement.belongsTo(Ecole, { foreignKey: 'ecole_id', as: 'ecole' });

Utilisateur.hasMany(Paiement, { foreignKey: 'utilisateur_id', as: 'paiements' });
Paiement.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

Paiement.belongsTo(Abonnement, { foreignKey: 'abonnement_id', as: 'abonnement' });

Ecole.hasMany(Utilisateur, { foreignKey: 'ecole_id', as: 'membres' });
Utilisateur.belongsTo(Ecole, { foreignKey: 'ecole_id', as: 'ecole' });

Utilisateur.hasMany(ReinitialisationMdp, { foreignKey: 'utilisateur_id', as: 'reinitialisations_mdp' });
ReinitialisationMdp.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

Utilisateur.hasMany(Joueur, { foreignKey: 'utilisateur_id', as: 'joueurs' });
Joueur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'entraineur' });
Joueur.belongsTo(Abonnement, { foreignKey: 'abonnement_id', as: 'abonnement' });
Abonnement.hasMany(Joueur, { foreignKey: 'abonnement_id', as: 'joueurs' });

Utilisateur.hasMany(Match, { foreignKey: 'utilisateur_id', as: 'matchs' });
Match.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'entraineur' });

Match.hasMany(LigneStatMatch, { foreignKey: 'match_id', as: 'lignes_stats' });
LigneStatMatch.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
LigneStatMatch.belongsTo(Joueur, { foreignKey: 'joueur_id', as: 'joueur' });
Joueur.hasMany(LigneStatMatch, { foreignKey: 'joueur_id', as: 'lignes_stats' });

Utilisateur.hasMany(EpsEleve, { foreignKey: 'utilisateur_id', as: 'eps_eleves' });
EpsEleve.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'professeur' });
EpsEleve.belongsTo(Ecole, { foreignKey: 'ecole_id', as: 'ecole' });
Ecole.hasMany(EpsEleve, { foreignKey: 'ecole_id', as: 'eps_eleves' });

EpsEleve.hasMany(EpsBacLigne, { foreignKey: 'eleve_id', as: 'lignes_bac' });
EpsBacLigne.belongsTo(EpsEleve, { foreignKey: 'eleve_id', as: 'eleve' });

EpsEleve.hasMany(EpsClasseNotation, { foreignKey: 'eleve_id', as: 'notations_classe' });
EpsClasseNotation.belongsTo(EpsEleve, { foreignKey: 'eleve_id', as: 'eleve' });

Utilisateur.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activity_logs' });
ActivityLog.belongsTo(Utilisateur, { foreignKey: 'user_id', as: 'utilisateur' });

Utilisateur.hasOne(UserPreference, { foreignKey: 'user_id', as: 'preferences' });
UserPreference.belongsTo(Utilisateur, { foreignKey: 'user_id', as: 'utilisateur' });

Utilisateur.hasMany(ClasseEval, { foreignKey: 'user_id', as: 'classes_eval' });
ClasseEval.belongsTo(Utilisateur, { foreignKey: 'user_id', as: 'professeur' });

ClasseEval.hasMany(EleveClasse, { foreignKey: 'classe_id', as: 'eleves' });
EleveClasse.belongsTo(ClasseEval, { foreignKey: 'classe_id', as: 'classe' });
Utilisateur.hasMany(EleveClasse, { foreignKey: 'user_id', as: 'eleves_classe' });
EleveClasse.belongsTo(Utilisateur, { foreignKey: 'user_id', as: 'professeur' });

ClasseEval.hasMany(SeanceEvalClasse, { foreignKey: 'classe_id', as: 'seances' });
SeanceEvalClasse.belongsTo(ClasseEval, { foreignKey: 'classe_id', as: 'classe' });
Utilisateur.hasMany(SeanceEvalClasse, { foreignKey: 'user_id', as: 'seances_eval' });
SeanceEvalClasse.belongsTo(Utilisateur, { foreignKey: 'user_id', as: 'professeur' });

SeanceEvalClasse.hasMany(NoteClasseEval, { foreignKey: 'seance_id', as: 'notes' });
NoteClasseEval.belongsTo(SeanceEvalClasse, { foreignKey: 'seance_id', as: 'seance' });
EleveClasse.hasMany(NoteClasseEval, { foreignKey: 'eleve_id', as: 'notes_classe' });
NoteClasseEval.belongsTo(EleveClasse, { foreignKey: 'eleve_id', as: 'eleve' });

module.exports = {
  sequelize,
  Utilisateur,
  SessionActive,
  Application,
  Ecole,
  Abonnement,
  Paiement,
  ReinitialisationMdp,
  Joueur,
  Match,
  LigneStatMatch,
  EpsEleve,
  EpsBacLigne,
  EpsClasseNotation,
  ActivityLog,
  AdminMeta,
  UserPreference,
  ClasseEval,
  EleveClasse,
  SeanceEvalClasse,
  NoteClasseEval,
  ConfigGlobale,
};
