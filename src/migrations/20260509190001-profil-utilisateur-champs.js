'use strict';

/** Champs profil public (photo, contact, club). */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('utilisateurs', 'photo_url', {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
    await queryInterface.addColumn('utilisateurs', 'telephone', {
      type: Sequelize.STRING(32),
      allowNull: true,
    });
    await queryInterface.addColumn('utilisateurs', 'ville', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn('utilisateurs', 'nom_club', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('utilisateurs', 'photo_url');
    await queryInterface.removeColumn('utilisateurs', 'telephone');
    await queryInterface.removeColumn('utilisateurs', 'ville');
    await queryInterface.removeColumn('utilisateurs', 'nom_club');
  },
};
