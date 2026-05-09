/** Classe EPS (évaluation continue). */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClasseEval = sequelize.define(
    'ClasseEval',
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
      nom: { type: DataTypes.STRING(200), allowNull: false },
      niveau: { type: DataTypes.STRING(120), allowNull: true },
      annee_scolaire: { type: DataTypes.STRING(32), allowNull: false },
      nombre_eleves: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'classes',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  return ClasseEval;
};
