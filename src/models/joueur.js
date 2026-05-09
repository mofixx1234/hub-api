/**
 * Joueur (sport) — propriété par entraîneur (utilisateur_id).
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Joueur = sequelize.define(
    'Joueur',
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
      abonnement_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'abonnements', key: 'id' },
        onDelete: 'SET NULL',
      },
      nom: { type: DataTypes.STRING(120), allowNull: false },
      numero: { type: DataTypes.SMALLINT, allowNull: true },
      position: { type: DataTypes.STRING(64), allowNull: true },
      photo_url: { type: DataTypes.STRING(512), allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'joueurs',
      paranoid: false,
    }
  );

  return Joueur;
};
