/**
 * Modèle Utilisateur — compte unique Hub (multi-abonnements plus tard).
 */
const { DataTypes } = require('sequelize');

const TYPES_UTILISATEUR = ['entraineur', 'prof_eps', 'admin_ecole', 'admin_central'];

module.exports = (sequelize) => {
  const Utilisateur = sequelize.define(
    'Utilisateur',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
      },
      mot_de_passe: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      nom: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      type_utilisateur: {
        type: DataTypes.ENUM(...TYPES_UTILISATEUR),
        allowNull: false,
        defaultValue: 'entraineur',
      },
      ecole_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'ecoles', key: 'id' },
        onDelete: 'SET NULL',
      },
      onboarding_complete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      photo_url: { type: DataTypes.STRING(512), allowNull: true },
      telephone: { type: DataTypes.STRING(32), allowNull: true },
      ville: { type: DataTypes.STRING(120), allowNull: true },
      nom_club: { type: DataTypes.STRING(200), allowNull: true },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'utilisateurs',
      paranoid: false,
    }
  );

  Utilisateur.TYPES = TYPES_UTILISATEUR;

  return Utilisateur;
};
