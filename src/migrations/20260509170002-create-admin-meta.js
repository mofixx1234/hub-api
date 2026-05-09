'use strict';

/** Clés système (ex. dernier webhook Wave reçu). */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_meta', {
      cle: {
        type: Sequelize.STRING(64),
        allowNull: false,
        primaryKey: true,
      },
      valeur_json: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admin_meta');
  },
};
