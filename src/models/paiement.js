/**
 * Paiement Wave — lien optionnel vers abonnement créé après webhook réussi.
 */
const { DataTypes } = require('sequelize');

const STATUTS = ['pending', 'success', 'failed'];

module.exports = (sequelize) => {
  const Paiement = sequelize.define(
    'Paiement',
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
      abonnement_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'abonnements', key: 'id' },
        onDelete: 'SET NULL',
      },
      montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      devise: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'XOF' },
      transaction_wave_id: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
      },
      wave_session_id: { type: DataTypes.STRING(128), allowNull: true },
      statut: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'pending',
        validate: { isIn: [STATUTS] },
      },
      donnees_commande: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      date_paiement: { type: DataTypes.DATE, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'paiements',
      paranoid: false,
    }
  );

  Paiement.STATUTS = STATUTS;

  return Paiement;
};
