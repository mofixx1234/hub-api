'use strict';

/** Rattachement prof EPS / admin école à une ligne ecoles. */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('utilisateurs', 'ecole_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'ecoles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('utilisateurs', ['ecole_id'], {
      name: 'utilisateurs_ecole_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('utilisateurs', 'utilisateurs_ecole_id_idx');
    await queryInterface.removeColumn('utilisateurs', 'ecole_id');
  },
};
