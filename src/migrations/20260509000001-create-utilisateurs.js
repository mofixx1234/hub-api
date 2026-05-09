'use strict';

/** Table utilisateurs — enum type_utilisateur, index unique email (comptes non supprimés). */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryInterface.createTable('utilisateurs', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      mot_de_passe: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      prenom: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      nom: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      type_utilisateur: {
        type: Sequelize.ENUM('entraineur', 'prof_eps', 'admin_ecole', 'admin_central'),
        allowNull: false,
        defaultValue: 'entraineur',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX utilisateurs_email_actifs_unique
      ON utilisateurs (lower(email))
      WHERE deleted_at IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS utilisateurs_email_actifs_unique;');
    await queryInterface.dropTable('utilisateurs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_utilisateurs_type_utilisateur";');
  },
};
