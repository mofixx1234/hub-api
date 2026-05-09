/**
 * Validation création session paiement Wave (corps JSON).
 */
const { z } = require('zod');

const sessionWaveSchema = z
  .object({
    montant: z.coerce.number().positive(),
    apps_incluses: z.array(z.string().uuid()).min(1),
    rubrique: z.enum(['SPORT', 'ENSEIGNEMENT_CI', 'ENSEIGNEMENT_FR']),
    type_abonnement: z.enum(['formule', 'a_la_carte']),
    programme: z.enum(['francais', 'ivoirien']),
    sport: z.string().max(64).optional().nullable(),
    ecole_id: z.string().uuid().optional().nullable(),
    /** Candidat libre FR : pas d’école ; école homologuée : ecole_id obligatoire. */
    parcours_francais: z.enum(['candidat_libre', 'ecole_homologuee']).optional(),
    duree_jours: z.coerce.number().int().min(1).max(365).optional().default(30),
  })
  .superRefine((data, ctx) => {
    const estFr = data.rubrique === 'ENSEIGNEMENT_FR';
    const candidat =
      data.parcours_francais === 'candidat_libre' ||
      (estFr && !data.ecole_id && data.parcours_francais !== 'ecole_homologuee');

    if (estFr && data.parcours_francais === 'ecole_homologuee' && !data.ecole_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ecole_id est requis pour une école homologuée.',
        path: ['ecole_id'],
      });
    }
    if (estFr && data.parcours_francais === 'candidat_libre' && data.ecole_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ne pas renseigner ecole_id pour le parcours candidat libre.',
        path: ['ecole_id'],
      });
    }
    if (estFr && !data.parcours_francais && !data.ecole_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Indiquez parcours_francais (candidat_libre ou ecole_homologuee) ou fournissez ecole_id.',
        path: ['parcours_francais'],
      });
    }
    if (data.rubrique === 'ENSEIGNEMENT_CI' && data.programme !== 'ivoirien') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENSEIGNEMENT_CI impose programme ivoirien.',
        path: ['programme'],
      });
    }
    if (data.rubrique === 'ENSEIGNEMENT_FR' && data.programme !== 'francais') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENSEIGNEMENT_FR impose programme français.',
        path: ['programme'],
      });
    }
  });

module.exports = { sessionWaveSchema };
