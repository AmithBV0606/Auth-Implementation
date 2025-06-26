"use server";

import { z } from "zod";
import { signInSchema, signUpSchema } from "./schemas";
import { redirect } from "next/navigation";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { UserTable } from "@/drizzle/schema";
import { generateSalt, hashPassword } from "../core/passwordHasher";
import { cookies } from "next/headers";
import { createUserSession } from "../core/session";

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData);

  if (!success) return "Unable to Log you In!";

  // To check if the user with the entered email, exists in our DB :
  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, data.email),
  });

  if (existingUser != null) return "Account already exists for this email!";

  // If the entered email doesn't exist in our DB(Means, it's a new user), we do the following :
  try {
    // 1. We generate the salt and hash the password :
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);
    // console.log(hashedPassword);

    // 2. Then we'll create the new user in our DB :
    const [user] = await db
      .insert(UserTable)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt,
      })
      .returning({ id: UserTable.id, role: UserTable.role });

    if (user == null) return "Unable to create account!!";

    // 3. Create a user session :
    await createUserSession(user, await cookies());
  } catch (error) {
    return "Unable to create account!!";
  }

  redirect("/");
}

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
  const { success, data } = signInSchema.safeParse(unsafeData);

  if (!success) return "Unable to Log you In!";

  redirect("/");
}

export async function oAuthSignIn() {}
