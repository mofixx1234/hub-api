'use strict';

/** Tour guidé : nouveaux comptes onboarding_complete = false ; comptes existants passent à true. */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('utilisateurs', 'onboarding_complete', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.sequelize.query(
      'UPDATE utilisateurs SET onboarding_complete = true WHERE deleted_at IS NULL;'
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('utilisateurs', 'onboarding_complete');
  },
};
