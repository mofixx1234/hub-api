/** Séance d’EPS pour une classe (note par élève). */
const { DataTypes } = require('sequelize');

const TRIMESTRES = ['T1', 'T2', 'T3'];

module.exports = (sequelize) => {
  const SeanceEvalClasse = sequelize.define(
    'SeanceEvalClasse',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      classe_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onDelete: 'CASCADE',
      },
      titre: { type: DataTypes.STRING(255), allowNull: false },
      date_seance: { type: DataTypes.DATEONLY, allowNull: false },
      type_activite: { type: DataTypes.STRING(120), allowNull: true },
      coefficient: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1,
      },
      trimestre: {
        type: DataTypes.STRING(2),
        allowNull: false,
        validate: { isIn: [TRIMESTRES] },
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'seances',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  SeanceEvalClasse.TRIMESTRES = TRIMESTRES;
  return SeanceEvalClasse;
};
