/** Élève rattaché à une classe d’évaluation continue. */
const { DataTypes } = require('sequelize');

const SEXES = ['M', 'F'];

module.exports = (sequelize) => {
  const EleveClasse = sequelize.define(
    'EleveClasse',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      classe_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      nom: { type: DataTypes.STRING(120), allowNull: false },
      prenom: { type: DataTypes.STRING(120), allowNull: false },
      numero_matricule: { type: DataTypes.STRING(64), allowNull: true },
      sexe: {
        type: DataTypes.STRING(1),
        allowNull: false,
        validate: { isIn: [SEXES] },
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'eleves_classe',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  EleveClasse.SEXES = SEXES;
  return EleveClasse;
};
