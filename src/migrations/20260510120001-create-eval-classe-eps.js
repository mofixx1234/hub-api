'use strict';

/**
 * Évaluation classe EPS — classes, élèves, séances, notes (contrôle continu).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      nom: { type: Sequelize.STRING(200), allowNull: false },
      niveau: { type: Sequelize.STRING(120), allowNull: true },
      annee_scolaire: { type: Sequelize.STRING(32), allowNull: false },
      nombre_eleves: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('classes', ['user_id'], { name: 'classes_user_idx' });

    await queryInterface.createTable('eleves_classe', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      classe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      nom: { type: Sequelize.STRING(120), allowNull: false },
      prenom: { type: Sequelize.STRING(120), allowNull: false },
      numero_matricule: { type: Sequelize.STRING(64), allowNull: true },
      sexe: { type: Sequelize.STRING(1), allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('eleves_classe', ['classe_id'], { name: 'eleves_classe_classe_idx' });
    await queryInterface.addIndex('eleves_classe', ['user_id'], { name: 'eleves_classe_user_idx' });

    await queryInterface.createTable('seances', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
      },
      classe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onDelete: 'CASCADE',
      },
      titre: { type: Sequelize.STRING(255), allowNull: false },
      date_seance: { type: Sequelize.DATEONLY, allowNull: false },
      type_activite: { type: Sequelize.STRING(120), allowNull: true },
      coefficient: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1,
      },
      trimestre: { type: Sequelize.STRING(2), allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('seances', ['classe_id', 'date_seance'], {
      name: 'seances_classe_date_idx',
    });
    await queryInterface.addIndex('seances', ['user_id'], { name: 'seances_user_idx' });

    await queryInterface.createTable('notes_classe', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      seance_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'seances', key: 'id' },
        onDelete: 'CASCADE',
      },
      eleve_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'eleves_classe', key: 'id' },
        onDelete: 'CASCADE',
      },
      note: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
      observation: { type: Sequelize.TEXT, allowNull: true },
      absent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
    await queryInterface.addIndex('notes_classe', ['seance_id', 'eleve_id'], {
      unique: true,
      name: 'notes_classe_seance_eleve_unique',
    });
    await queryInterface.addIndex('notes_classe', ['eleve_id'], { name: 'notes_classe_eleve_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notes_classe');
    await queryInterface.dropTable('seances');
    await queryInterface.dropTable('eleves_classe');
    await queryInterface.dropTable('classes');
  },
};
