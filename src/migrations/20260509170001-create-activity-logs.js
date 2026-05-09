'use strict';

/** Journal d’activité — analytics et stats personnelles. */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      app_name: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('activity_logs', ['user_id', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['action', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['app_name', 'created_at']);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_action_chk
      CHECK (action IN ('login', 'logout', 'app_access', 'export', 'save'));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_action_chk;'
    );
    await queryInterface.dropTable('activity_logs');
  },
};
