/** Journal d’activité utilisateur / système. */
const { DataTypes } = require('sequelize');

const ACTIONS = ['login', 'logout', 'app_access', 'export', 'save'];

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'SET NULL',
      },
      action: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      app_name: { type: DataTypes.STRING(64), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    {
      tableName: 'activity_logs',
      paranoid: false,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  ActivityLog.ACTIONS = ACTIONS;
  return ActivityLog;
};
