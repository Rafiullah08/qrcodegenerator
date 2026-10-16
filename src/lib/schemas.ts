import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter an email address.")
  .email("Enter a valid email address.")
  .max(254, "This email address is too long.");

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color, such as #111827.");

export const requiredTextSchema = (message: string) => z.string().trim().min(1, message);

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check this field.";
}
