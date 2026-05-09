'use strict';

/**
 * Configuration globale (barèmes officiels CI, etc.) — JSON éditable par admin.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('config_globale', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      cle: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      valeur: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.sequelize.query(`
      INSERT INTO config_globale (cle, valeur, description)
      VALUES (
        'baremes_ci_officiel',
        '{
          "version": 1,
          "notice": "Structure indicative — remplacer par les barèmes officiels du MENA-CI. Paires [performance, points sur 20].",
          "garcon": {
            "course_50m_sec": [[6.5, 20], [7.0, 18], [7.5, 16], [8.5, 12], [10.0, 8], [12.0, 4]],
            "course_100m_sec": [[10.5, 20], [11.0, 18], [12.0, 15], [13.5, 12], [15.0, 10], [18.0, 5]],
            "saut_longueur_m": [[7.0, 20], [6.5, 18], [6.0, 15], [5.0, 12], [4.0, 8], [3.0, 4]],
            "lancer_poids_m": [[12.0, 20], [11.0, 18], [10.0, 15], [8.0, 12], [6.0, 8], [4.0, 4]]
          },
          "fille": {
            "course_50m_sec": [[7.0, 20], [7.5, 18], [8.0, 16], [9.5, 12], [11.0, 8], [13.0, 4]],
            "course_100m_sec": [[11.5, 20], [12.0, 18], [13.0, 15], [14.5, 12], [16.0, 10], [19.0, 5]],
            "saut_longueur_m": [[6.0, 20], [5.5, 18], [5.0, 15], [4.2, 12], [3.5, 8], [2.8, 4]],
            "lancer_poids_m": [[10.0, 20], [9.0, 18], [8.0, 15], [6.5, 12], [5.0, 8], [3.5, 4]]
          }
        }'::jsonb,
        'Barèmes EPS BAC — programme ivoirien (MENA-CI). Les notes déjà saisies ne sont pas recalculées si le barème change.'
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('config_globale');
  },
};
