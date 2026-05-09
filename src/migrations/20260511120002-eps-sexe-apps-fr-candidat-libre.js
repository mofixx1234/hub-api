'use strict';

const EPS_BAC_FR_LIBRE = 'a1111111-1111-4111-8111-111111111303';
const EPS_CLASSE_FR_LIBRE = 'a1111111-1111-4111-8111-111111111304';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('eps_eleves', 'sexe', {
      type: Sequelize.CHAR(1),
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE eps_eleves ADD CONSTRAINT eps_eleves_sexe_chk
      CHECK (sexe IS NULL OR sexe IN ('M', 'F'));
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO applications (id, nom, description, rubrique, categorie, prix_individuel, url_app, icone, specifique_ecole, created_at, deleted_at)
      VALUES
        (
          '${EPS_BAC_FR_LIBRE}',
          'Évaluation BAC — Candidat libre',
          'Barèmes génériques programme français (hors barème école).',
          'ENSEIGNEMENT_FR'::enum_rubrique,
          'evaluation',
          8500,
          '/apps/eps/fr-libre/evaluation-bac',
          '📋',
          false,
          NOW(),
          NULL
        ),
        (
          '${EPS_CLASSE_FR_LIBRE}',
          'Évaluation classe — Candidat libre',
          'Notes continues et bulletins — programme français indépendant.',
          'ENSEIGNEMENT_FR'::enum_rubrique,
          'evaluation',
          6500,
          '/apps/eps/fr-libre/evaluation-classe',
          '✏️',
          false,
          NOW(),
          NULL
        );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM applications WHERE id IN ('${EPS_BAC_FR_LIBRE}', '${EPS_CLASSE_FR_LIBRE}');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE eps_eleves DROP CONSTRAINT IF EXISTS eps_eleves_sexe_chk;
    `);
    await queryInterface.removeColumn('eps_eleves', 'sexe');
  },
};
