"use server";

import { z } from "zod";
import { signInSchema, signUpSchema } from "./schemas";

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {}

export async function oAuthSignIn() {}