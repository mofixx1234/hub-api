/**
 * Ligne d’abonnement — isolée par rubrique / école ; apps_incluses = UUIDs catalogue.
 */
const { DataTypes } = require('sequelize');

const RUBRIQUES = ['SPORT', 'ENSEIGNEMENT_CI', 'ENSEIGNEMENT_FR'];
const TYPES_ABONNEMENT = ['formule', 'a_la_carte'];
const PROGRAMMES = ['francais', 'ivoirien'];
const STATUTS = ['actif', 'expire', 'suspendu'];

module.exports = (sequelize) => {
  const Abonnement = sequelize.define(
    'Abonnement',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      rubrique: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: { isIn: [RUBRIQUES] },
      },
      type_abonnement: {
        type: DataTypes.STRING(24),
        allowNull: false,
        validate: { isIn: [TYPES_ABONNEMENT] },
      },
      sport: { type: DataTypes.STRING(64), allowNull: true },
      ecole_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'ecoles', key: 'id' },
        onDelete: 'SET NULL',
      },
      programme: {
        type: DataTypes.STRING(16),
        allowNull: false,
        validate: { isIn: [PROGRAMMES] },
      },
      apps_incluses: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      date_debut: { type: DataTypes.DATE, allowNull: false },
      date_fin: { type: DataTypes.DATE, allowNull: false },
      montant_paye: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      statut: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'actif',
        validate: { isIn: [STATUTS] },
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'abonnements',
      paranoid: false,
    }
  );

  Abonnement.RUBRIQUES = RUBRIQUES;
  Abonnement.TYPES_ABONNEMENT = TYPES_ABONNEMENT;
  Abonnement.PROGRAMMES = PROGRAMMES;
  Abonnement.STATUTS = STATUTS;

  return Abonnement;
};
