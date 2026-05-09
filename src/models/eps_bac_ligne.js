/** Ligne d’épreuve BAC EPS (points calculés côté serveur). */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'EpsBacLigne',
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
      code_epreuve: { type: DataTypes.STRING(64), allowNull: false },
      valeur_brute: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
      points_attribues: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'eps_bac_lignes', paranoid: false, updatedAt: false, createdAt: 'created_at' }
  );
