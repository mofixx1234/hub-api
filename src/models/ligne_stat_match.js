/** Statistiques d’un joueur sur un match. */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'LigneStatMatch',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      match_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'matchs', key: 'id' },
        onDelete: 'CASCADE',
      },
      joueur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'joueurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      points: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      passes: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      rebonds: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      minutes_jeu: { type: DataTypes.SMALLINT, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'lignes_stats_match',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );
