/** Élève suivi par un prof EPS (scope : bac_ci, classe_ci, bac_fr, classe_fr). */
const { DataTypes } = require('sequelize');

const SCOPES = ['bac_ci', 'classe_ci', 'bac_fr', 'classe_fr'];

module.exports = (sequelize) => {
  const EpsEleve = sequelize.define(
    'EpsEleve',
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
      ecole_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'ecoles', key: 'id' },
        onDelete: 'SET NULL',
      },
      scope: {
        type: DataTypes.STRING(16),
        allowNull: false,
        validate: { isIn: [SCOPES] },
      },
      nom: { type: DataTypes.STRING(120), allowNull: false },
      prenom: { type: DataTypes.STRING(120), allowNull: false },
      classe: { type: DataTypes.STRING(64), allowNull: true },
      sexe: {
        type: DataTypes.CHAR(1),
        allowNull: true,
        validate: { isIn: [['M', 'F']] },
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'eps_eleves', paranoid: false, updatedAt: false, createdAt: 'created_at' }
  );

  EpsEleve.SCOPES = SCOPES;
  return EpsEleve;
};
