/**
 * Application métier du Hub (sport, EPS CI, EPS FR par école).
 */
const { DataTypes } = require('sequelize');

const RUBRIQUES = ['SPORT', 'ENSEIGNEMENT_CI', 'ENSEIGNEMENT_FR'];

module.exports = (sequelize) => {
  const Application = sequelize.define(
    'Application',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nom: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      rubrique: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: { isIn: [RUBRIQUES] },
      },
      categorie: { type: DataTypes.STRING(64), allowNull: false },
      prix_individuel: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      url_app: { type: DataTypes.STRING(512), allowNull: false },
      icone: { type: DataTypes.STRING(64), allowNull: true },
      specifique_ecole: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'applications',
      paranoid: false,
    }
  );

  Application.RUBRIQUES = RUBRIQUES;

  return Application;
};
