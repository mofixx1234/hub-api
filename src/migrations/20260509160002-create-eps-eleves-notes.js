'use strict';

/**
 * Élèves EPS (prof) + notes BAC + notes classe.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('eps_eleves', {
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
      ecole_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'ecoles', key: 'id' },
        onDelete: 'SET NULL',
      },
      scope: { type: Sequelize.STRING(16), allowNull: false },
      nom: { type: Sequelize.STRING(120), allowNull: false },
      prenom: { type: Sequelize.STRING(120), allowNull: false },
      classe: { type: Sequelize.STRING(64), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('eps_bac_lignes', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      eleve_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'eps_eleves', key: 'id' },
        onDelete: 'CASCADE',
      },
      code_epreuve: { type: Sequelize.STRING(64), allowNull: false },
      valeur_brute: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      points_attribues: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('eps_classe_notations', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      eleve_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'eps_eleves', key: 'id' },
        onDelete: 'CASCADE',
      },
      titre: { type: Sequelize.STRING(200), allowNull: false },
      note: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      periode: { type: Sequelize.STRING(64), allowNull: true },
      commentaire: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('eps_eleves', ['utilisateur_id'], {
      name: 'eps_eleves_utilisateur_idx',
    });
    await queryInterface.addIndex('eps_eleves', ['scope'], { name: 'eps_eleves_scope_idx' });
    await queryInterface.addIndex('eps_bac_lignes', ['eleve_id'], {
      name: 'eps_bac_lignes_eleve_idx',
    });
    await queryInterface.addIndex('eps_classe_notations', ['eleve_id'], {
      name: 'eps_classe_eleve_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('eps_classe_notations');
    await queryInterface.dropTable('eps_bac_lignes');
    await queryInterface.dropTable('eps_eleves');
  },
};
