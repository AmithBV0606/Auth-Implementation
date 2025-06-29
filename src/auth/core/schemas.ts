import { userRoles } from "@/drizzle/schema";
import { z } from "zod";

export const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(userRoles),
});

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable(),
  email: z.string().email(),
});
