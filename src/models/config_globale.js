/** Configuration clé / valeur JSON (barèmes officiels, etc.). */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConfigGlobale = sequelize.define(
    'ConfigGlobale',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cle: { type: DataTypes.STRING(128), allowNull: false, unique: true },
      valeur: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      description: { type: DataTypes.TEXT, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'config_globale',
      timestamps: false,
      updatedAt: 'updated_at',
      createdAt: false,
    }
  );

  return ConfigGlobale;
};
