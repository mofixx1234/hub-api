/**
 * Validation paiement collectif école (Wave).
 */
const { z } = require('zod');

const beneficiaireSchema = z.object({
  utilisateur_id: z.string().uuid(),
  apps_incluses: z.array(z.string().uuid()).min(1),
  rubrique: z.enum(['SPORT', 'ENSEIGNEMENT_CI', 'ENSEIGNEMENT_FR']),
  type_abonnement: z.enum(['formule', 'a_la_carte']),
  programme: z.enum(['francais', 'ivoirien']),
  sport: z.string().max(64).optional().nullable(),
});

const sessionCollectifSchema = z.object({
  ecole_id: z.string().uuid(),
  beneficiaires: z.array(beneficiaireSchema).min(1),
  duree_jours: z.coerce.number().int().min(1).max(365).optional().default(30),
});

module.exports = { sessionCollectifSchema, beneficiaireSchema };
