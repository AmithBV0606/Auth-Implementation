"use server";

import { z } from "zod";
import { signInSchema, signUpSchema } from "./schemas";
import { redirect } from "next/navigation";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { UserTable } from "@/drizzle/schema";
import {
  comparePassword,
  generateSalt,
  hashPassword,
} from "../core/passwordHasher";
import { cookies } from "next/headers";
import { createUserSession, removeUserFromSession } from "../core/session";

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

  // Check if user with the entered email exists in our DB. If exists return the following columns :
  const user = await db.query.UserTable.findFirst({
    columns: { password: true, salt: true, id: true, email: true, role: true },
    where: eq(UserTable.email, data.email),
  });

  // If user not found :
  if (user == null || user.password == null || user.salt == null) {
    return "Unable to log you in";
  }

  // If the user exists, we need to verify the password :
  const isCorrectPassword = await comparePassword({
    password: data.password,
    salt: user.salt,
    hashedPassword: user.password,
  });

  if (!isCorrectPassword) return "Unable to log you In!!";

  await createUserSession(user, await cookies());

  redirect("/");
}

export async function logOut() {
  await removeUserFromSession(await cookies());
  redirect("/");
}

export async function oAuthSignIn() {}
