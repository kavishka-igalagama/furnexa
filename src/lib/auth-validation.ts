import { z } from "zod";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[^A-Za-z0-9]/, "Must include a symbol");

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.preprocess(
    (value) => (typeof value === "string" ? normalizeEmail(value) : value),
    z.string().email().max(190),
  ),
  password: passwordSchema,
});
