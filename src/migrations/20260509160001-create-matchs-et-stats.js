'use strict';

/** Matchs et lignes de stats (liées aux joueurs du même entraîneur). */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('matchs', {
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
      joue_le: { type: Sequelize.DATEONLY, allowNull: false },
      adversaire: { type: Sequelize.STRING(200), allowNull: false },
      lieu: { type: Sequelize.STRING(255), allowNull: true },
      score_pour: { type: Sequelize.SMALLINT, allowNull: true },
      score_contre: { type: Sequelize.SMALLINT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('lignes_stats_match', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      match_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'matchs', key: 'id' },
        onDelete: 'CASCADE',
      },
      joueur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'joueurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      points: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 0 },
      passes: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 0 },
      rebonds: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 0 },
      minutes_jeu: { type: Sequelize.SMALLINT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('matchs', ['utilisateur_id'], { name: 'matchs_utilisateur_idx' });
    await queryInterface.addIndex('lignes_stats_match', ['match_id'], {
      name: 'lignes_stats_match_idx',
    });
    await queryInterface.addIndex('lignes_stats_match', ['joueur_id'], {
      name: 'lignes_stats_joueur_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('lignes_stats_match');
    await queryInterface.dropTable('matchs');
  },
};
