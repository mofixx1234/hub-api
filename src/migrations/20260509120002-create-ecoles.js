'use strict';

/**
 * Écoles (programme français homologué, barèmes JSON, etc.).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_programme AS ENUM ('francais', 'ivoirien');

      CREATE TABLE ecoles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(200) NOT NULL,
        domaine_email VARCHAR(120) NOT NULL,
        programme enum_programme NOT NULL,
        admin_email VARCHAR(255),
        apps_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
        baremes JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE UNIQUE INDEX ecoles_domaine_email_actifs_unique
      ON ecoles (lower(domaine_email))
      WHERE deleted_at IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ecoles;
      DROP TYPE IF EXISTS enum_programme;
    `);
  },
};
