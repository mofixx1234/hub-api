'use strict';

/**
 * Type enum_rubrique + table catalogue applications.
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_rubrique AS ENUM ('SPORT', 'ENSEIGNEMENT_CI', 'ENSEIGNEMENT_FR');

      CREATE TABLE applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(200) NOT NULL,
        description TEXT,
        rubrique enum_rubrique NOT NULL,
        categorie VARCHAR(64) NOT NULL,
        prix_individuel DECIMAL(12, 2) NOT NULL DEFAULT 0,
        url_app VARCHAR(512) NOT NULL,
        icone VARCHAR(64),
        specifique_ecole BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE INDEX applications_rubrique_idx ON applications (rubrique);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS applications;
      DROP TYPE IF EXISTS enum_rubrique;
    `);
  },
};
