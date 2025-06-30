import { OAuthClient } from "@/auth/core/oauth/base";
import { createUserSession } from "@/auth/core/session";
import { OAuthUser } from "@/auth/types";
import { db } from "@/drizzle/db";
import {
  OAuthProvider,
  oAuthProviders,
  UserOAuthAccountTable,
  UserTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params; // discord/github/google

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const provider = z.enum(oAuthProviders).parse(rawProvider);

  if (typeof code !== "string" || typeof state !== "string") {
    redirect(
      `/sign-in?oauthError=${encodeURIComponent(
        "Failed to connect. Please try again!!"
      )}`
    );
  }

  try {
    // Using the code we received from Discord/GitHub/Google, Fetch the user :
    const oAuthUser = await new OAuthClient().fetchUser(
      code,
      state,
      await cookies()
    );
    // console.log(user);

    // Usring the "oAuthUser" create a new "OAuthUserTable" entry
    const user = await connectUserToAccount(oAuthUser, provider);

    // Create session for the user who SignedIn/SignedUp through OAuth :
    await createUserSession(user, await cookies());
  } catch (error) {
    console.error(error);
    redirect(
      `/sign-in?oauthError=${encodeURIComponent(
        "Failed to connect. Please try again!!"
      )}`
    );
  }

  redirect("/");
}

async function connectUserToAccount(
  { id, name, email }: OAuthUser,
  provider: OAuthProvider
) {
  return db.transaction(async (trx) => {
    // Query the DB to check if the user already exists :
    let user = await trx.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
      columns: { id: true, role: true },
    });

    // If the user doesn't exists in our DB, we create a new entry fo t :
    if (user === null) {
      const [newUser] = await trx
        .insert(UserTable)
        .values({ name: name, email: email })
        .returning({ id: UserTable.id, role: UserTable.role });

      user = newUser;
    }

    if (user == null) throw new Error("Something went wrong!!");

    // Insert the new OAuth provider into our Database :
    await trx
      .insert(UserOAuthAccountTable)
      .values({ userId: user?.id, provider: provider, providerAccountId: id })
      .onConflictDoNothing();

    return user;
  });
}
