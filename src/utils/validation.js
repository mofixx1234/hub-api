/**
 * Schémas Zod — validation des entrées auth (corps JSON).
 */
const { z } = require('zod');

const inscriptionSchema = z.object({
  email: z.string().email().max(255),
  mot_de_passe: z.string().min(8).max(128),
  prenom: z.string().min(1).max(120),
  nom: z.string().min(1).max(120),
  /** Inscription publique : entraineur ou prof_eps uniquement (admins hors ligne). */
  type_utilisateur: z.enum(['entraineur', 'prof_eps']).optional(),
  device_id: z.string().max(128).optional(),
  device_name: z.string().max(255).optional(),
});

const connexionSchema = z.object({
  email: z.string().email().max(255),
  mot_de_passe: z.string().min(1).max(128),
  device_id: z.string().max(128).optional(),
  device_name: z.string().max(255).optional(),
});

const demandeMotDePasseSchema = z.object({
  email: z.string().email().max(255),
});

const confirmerMotDePasseSchema = z.object({
  token: z.string().min(32).max(128),
  mot_de_passe: z.string().min(8).max(128),
});

module.exports = {
  inscriptionSchema,
  connexionSchema,
  demandeMotDePasseSchema,
  confirmerMotDePasseSchema,
};
