/**
 * Établissement scolaire (ex. Jules Verne) — barèmes et apps sur mesure.
 */
const { DataTypes } = require('sequelize');

const PROGRAMMES = ['francais', 'ivoirien'];

module.exports = (sequelize) => {
  const Ecole = sequelize.define(
    'Ecole',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nom: { type: DataTypes.STRING(200), allowNull: false },
      domaine_email: { type: DataTypes.STRING(120), allowNull: false },
      programme: {
        type: DataTypes.STRING(16),
        allowNull: false,
        validate: { isIn: [PROGRAMMES] },
      },
      admin_email: { type: DataTypes.STRING(255), allowNull: true },
      apps_disponibles: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      baremes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'ecoles',
      paranoid: false,
    }
  );

  Ecole.PROGRAMMES = PROGRAMMES;

  return Ecole;
};
