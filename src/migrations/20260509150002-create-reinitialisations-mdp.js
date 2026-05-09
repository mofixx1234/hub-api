'use strict';

/** Jetons reset mot de passe (15 min, usage unique). */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reinitialisations_mdp', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      token_hash: { type: Sequelize.STRING(64), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('reinitialisations_mdp', ['token_hash'], {
      unique: true,
      name: 'reinitialisations_mdp_token_hash_unique',
    });
    await queryInterface.addIndex('reinitialisations_mdp', ['utilisateur_id'], {
      name: 'reinitialisations_mdp_utilisateur_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reinitialisations_mdp');
  },
};
