'use strict';

/**
 * Historique des paiements Wave — transaction_wave_id unique (idempotence webhook).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_statut_paiement AS ENUM ('pending', 'success', 'failed');

      CREATE TABLE paiements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        abonnement_id UUID REFERENCES abonnements(id) ON DELETE SET NULL,
        montant DECIMAL(12, 2) NOT NULL,
        devise VARCHAR(3) NOT NULL DEFAULT 'XOF',
        transaction_wave_id VARCHAR(128) UNIQUE,
        wave_session_id VARCHAR(128),
        statut enum_statut_paiement NOT NULL DEFAULT 'pending',
        donnees_commande JSONB NOT NULL DEFAULT '{}'::jsonb,
        date_paiement TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE INDEX paiements_utilisateur_idx ON paiements (utilisateur_id);
      CREATE INDEX paiements_abonnement_idx ON paiements (abonnement_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS paiements;
      DROP TYPE IF EXISTS enum_statut_paiement;
    `);
  },
};
