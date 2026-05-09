'use strict';

/**
 * Données initiales du catalogue (identifiants fixes pour référence / tests).
 */

const IDS = {
  sportGestion: 'a1111111-1111-4111-8111-111111111101',
  sportStats: 'a1111111-1111-4111-8111-111111111102',
  epsBacCi: 'a1111111-1111-4111-8111-111111111201',
  epsClasseCi: 'a1111111-1111-4111-8111-111111111202',
  epsBacJv: 'a1111111-1111-4111-8111-111111111301',
  epsClasseJv: 'a1111111-1111-4111-8111-111111111302',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO applications (id, nom, description, rubrique, categorie, prix_individuel, url_app, icone, specifique_ecole)
      VALUES
        (
          '${IDS.sportGestion}',
          'Gestion d''équipe',
          'Joueurs, compositions, fiches — basketball (extensible).',
          'SPORT',
          'gestion',
          5000,
          '/apps/sport/gestion-equipe',
          '🏀',
          false
        ),
        (
          '${IDS.sportStats}',
          'Statistiques',
          'Stats matchs, tendances, classements joueurs.',
          'SPORT',
          'stats',
          5000,
          '/apps/sport/statistiques',
          '📊',
          false
        ),
        (
          '${IDS.epsBacCi}',
          'Évaluation BAC (programme ivoirien)',
          'Saisie épreuves EPS et calcul selon barème CI.',
          'ENSEIGNEMENT_CI',
          'evaluation',
          3000,
          '/apps/eps/ci/evaluation-bac',
          '📝',
          false
        ),
        (
          '${IDS.epsClasseCi}',
          'Évaluation classe (programme ivoirien)',
          'Notes continues, moyennes, bulletins.',
          'ENSEIGNEMENT_CI',
          'evaluation',
          3000,
          '/apps/eps/ci/evaluation-classe',
          '📗',
          false
        ),
        (
          '${IDS.epsBacJv}',
          'Évaluation BAC — Jules Verne',
          'Barèmes spécifiques école Jules Verne.',
          'ENSEIGNEMENT_FR',
          'evaluation',
          10000,
          '/apps/eps/jules-verne/evaluation-bac',
          '📘',
          true
        ),
        (
          '${IDS.epsClasseJv}',
          'Évaluation classe — Jules Verne',
          'Notes et bulletins selon barème Jules Verne.',
          'ENSEIGNEMENT_FR',
          'evaluation',
          10000,
          '/apps/eps/jules-verne/evaluation-classe',
          '📙',
          true
        );
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO ecoles (id, nom, domaine_email, programme, admin_email, apps_disponibles, baremes)
      VALUES (
        'e2222222-2222-4222-8222-222222222201',
        'Jules Verne Abidjan',
        '@julesverneciv.com',
        'francais',
        'admin@julesverneciv.com',
        '["${IDS.epsBacJv}", "${IDS.epsClasseJv}"]'::jsonb,
        '{"source":"default_jules_verne","version":1}'::jsonb
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM ecoles WHERE id = 'e2222222-2222-4222-8222-222222222201';
      DELETE FROM applications WHERE id IN (
        '${IDS.sportGestion}', '${IDS.sportStats}', '${IDS.epsBacCi}', '${IDS.epsClasseCi}',
        '${IDS.epsBacJv}', '${IDS.epsClasseJv}'
      );
    `);
  },
};
