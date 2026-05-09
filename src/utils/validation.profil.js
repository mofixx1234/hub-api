const { z } = require('zod');

const profilMajSchema = z.object({
  prenom: z.string().min(1).max(120).optional(),
  nom: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  telephone: z.string().max(32).optional().nullable(),
  ville: z.string().max(120).optional().nullable(),
  nom_club: z.string().max(200).optional().nullable(),
  mot_de_passe_actuel: z.string().optional(),
});

const preferencesMajSchema = z.object({
  notif_connexion: z.boolean().optional(),
  notif_expiration: z.boolean().optional(),
  notif_rapport: z.boolean().optional(),
  notif_newsletter: z.boolean().optional(),
  theme: z.enum(['dark', 'light']).optional(),
  langue: z.string().max(8).optional(),
});

const exportDonneesSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  periode: z.enum(['mois', '6_mois', 'tout']).optional().default('mois'),
  app: z.enum(['toutes', 'eval_bac', 'gestion', 'stats']).optional().default('toutes'),
});

const supprimerCompteSchema = z.object({
  email: z.string().email(),
  mot_de_passe: z.string().min(1),
});

const changerMdpSchema = z.object({
  ancien: z.string().min(1),
  nouveau: z.string().min(8).max(128),
});

module.exports = {
  profilMajSchema,
  preferencesMajSchema,
  exportDonneesSchema,
  supprimerCompteSchema,
  changerMdpSchema,
};
