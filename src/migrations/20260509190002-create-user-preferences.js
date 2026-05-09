'use strict';

/** Préférences notifications & affichage. */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_preferences', {
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      notif_connexion: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notif_expiration: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notif_rapport: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notif_newsletter: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      theme: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'dark',
      },
      langue: {
        type: Sequelize.STRING(8),
        allowNull: false,
        defaultValue: 'fr',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_theme_chk
      CHECK (theme IN ('dark', 'light'));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_theme_chk;'
    );
    await queryInterface.dropTable('user_preferences');
  },
};
