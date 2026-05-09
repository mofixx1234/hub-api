const { z } = require('zod');

const joueurCreerSchema = z.object({
  nom: z.string().min(1).max(120),
  numero: z.coerce.number().int().min(0).max(99).optional().nullable(),
  position: z.string().max(64).optional().nullable(),
  photo_url: z.string().max(512).optional().nullable(),
});

const joueurModifierSchema = joueurCreerSchema.partial();

module.exports = { joueurCreerSchema, joueurModifierSchema };
