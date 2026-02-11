import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  phone: z.string().min(6, "Téléphone requis"),
  email: z.string().email("Email invalide"),
  country: z.string().min(2, "Pays requis"),
  city: z.string().min(2, "Ville requise"),
  password: z.string().min(6, "Mot de passe min 6 caractères"),

  // ✅ Conditions à l'inscription (demande client)
  acceptedConditions: z.boolean(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
