/**
 * Jeton unique pour réinitialisation du mot de passe (hash SHA-256 stocké).
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReinitialisationMdp = sequelize.define(
    'ReinitialisationMdp',
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
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'reinitialisations_mdp',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  return ReinitialisationMdp;
};
