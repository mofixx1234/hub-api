/** Note continue EPS (classe). */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'EpsClasseNotation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      eleve_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'eps_eleves', key: 'id' },
        onDelete: 'CASCADE',
      },
      titre: { type: DataTypes.STRING(200), allowNull: false },
      note: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
      periode: { type: DataTypes.STRING(64), allowNull: true },
      commentaire: { type: DataTypes.TEXT, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'eps_classe_notations',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );
