'use strict';

/** Joueurs — données isolées par entraîneur (optionnel abonnement pour multi-contexte). */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('joueurs', {
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
      abonnement_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'abonnements', key: 'id' },
        onDelete: 'SET NULL',
      },
      nom: { type: Sequelize.STRING(120), allowNull: false },
      numero: { type: Sequelize.SMALLINT, allowNull: true },
      position: { type: Sequelize.STRING(64), allowNull: true },
      photo_url: { type: Sequelize.STRING(512), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('joueurs', ['utilisateur_id'], {
      name: 'joueurs_utilisateur_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('joueurs');
  },
};
