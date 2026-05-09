const { z } = require('zod');

const trimestreSchema = z.enum(['T1', 'T2', 'T3']);
const sexeSchema = z.enum(['M', 'F']);

const classeCreateSchema = z.object({
  nom: z.string().min(1).max(200),
  niveau: z.string().max(120).optional().nullable(),
  annee_scolaire: z.string().min(4).max(32),
});

const classePatchSchema = classeCreateSchema.partial();

const eleveSchema = z.object({
  nom: z.string().min(1).max(120),
  prenom: z.string().min(1).max(120),
  numero_matricule: z.string().max(64).optional().nullable(),
  sexe: sexeSchema,
});

const seanceSchema = z.object({
  titre: z.string().min(1).max(255),
  date_seance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type_activite: z.string().max(120).optional().nullable(),
  coefficient: z.coerce.number().min(0.5).max(10).optional().default(1),
  trimestre: trimestreSchema,
});

const noteLigneSchema = z.object({
  eleve_id: z.string().uuid(),
  note: z.coerce.number().min(0).max(20).nullable().optional(),
  absent: z.boolean().optional().default(false),
  observation: z.string().max(5000).optional().nullable(),
});

const notesBulkSchema = z.object({
  lignes: z.array(noteLigneSchema).min(1),
});

const bulletinObservationSchema = z.object({
  observation_generale: z.string().max(8000).optional().nullable(),
});

module.exports = {
  classeCreateSchema,
  classePatchSchema,
  eleveSchema,
  seanceSchema,
  notesBulkSchema,
  bulletinObservationSchema,
  trimestreSchema,
};
