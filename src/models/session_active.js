/**
 * Une seule session active par utilisateur : nouvelle connexion = remplacement de la ligne.
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SessionActive = sequelize.define(
    'SessionActive',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      device_id: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      device_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      last_activity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'sessions_actives',
      paranoid: false,
    }
  );

  return SessionActive;
};
