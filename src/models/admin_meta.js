/** Paires clé / JSON pour métadonnées globales (alertes, santé Webhooks). */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminMeta = sequelize.define(
    'AdminMeta',
    {
      cle: { type: DataTypes.STRING(64), primaryKey: true },
      valeur_json: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'admin_meta',
      paranoid: false,
      timestamps: false,
    }
  );

  return AdminMeta;
};
