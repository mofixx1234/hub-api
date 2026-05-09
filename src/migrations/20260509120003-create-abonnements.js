'use strict';

/**
 * Abonnements utilisateur — apps_incluses = liste d’UUID d’applications (JSONB).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_type_abonnement AS ENUM ('formule', 'a_la_carte');
      CREATE TYPE enum_statut_abonnement AS ENUM ('actif', 'expire', 'suspendu');

      CREATE TABLE abonnements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        rubrique enum_rubrique NOT NULL,
        type_abonnement enum_type_abonnement NOT NULL,
        sport VARCHAR(64),
        ecole_id UUID REFERENCES ecoles(id) ON DELETE SET NULL,
        programme enum_programme NOT NULL,
        apps_incluses JSONB NOT NULL DEFAULT '[]'::jsonb,
        date_debut TIMESTAMPTZ NOT NULL,
        date_fin TIMESTAMPTZ NOT NULL,
        montant_paye DECIMAL(12, 2) NOT NULL DEFAULT 0,
        statut enum_statut_abonnement NOT NULL DEFAULT 'actif',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE INDEX abonnements_utilisateur_idx ON abonnements (utilisateur_id);
      CREATE INDEX abonnements_statut_idx ON abonnements (statut);
      CREATE INDEX abonnements_ecole_idx ON abonnements (ecole_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS abonnements;
      DROP TYPE IF EXISTS enum_statut_abonnement;
      DROP TYPE IF EXISTS enum_type_abonnement;
    `);
  },
};
