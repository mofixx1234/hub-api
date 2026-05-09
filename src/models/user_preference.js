/** Préférences utilisateur (notifications, thème). */
const { DataTypes } = require('sequelize');

const THEMES = ['dark', 'light'];

module.exports = (sequelize) => {
  const UserPreference = sequelize.define(
    'UserPreference',
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      notif_connexion: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      notif_expiration: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      notif_rapport: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      notif_newsletter: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      theme: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'dark',
        validate: { isIn: [THEMES] },
      },
      langue: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'fr' },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'user_preferences',
      paranoid: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  UserPreference.THEMES = THEMES;
  return UserPreference;
};
