/** Match enregistré par l’entraîneur. */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Match',
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
      joue_le: { type: DataTypes.DATEONLY, allowNull: false },
      adversaire: { type: DataTypes.STRING(200), allowNull: false },
      lieu: { type: DataTypes.STRING(255), allowNull: true },
      score_pour: { type: DataTypes.SMALLINT, allowNull: true },
      score_contre: { type: DataTypes.SMALLINT, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'matchs', paranoid: false, updatedAt: false, createdAt: 'created_at' }
  );
