import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { UserTable } from "@/drizzle/schema";
import { getUserFromSession } from "../core/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

// ____________________________________________________________________________________

// Types :

type FullUser = Exclude<
  Awaited<ReturnType<typeof getUserFromDB>>,
  undefined | null
>;

type User = Exclude<
  Awaited<ReturnType<typeof getUserFromSession>>,
  undefined | null
>;

// ____________________________________________________________________________________

// New method :
function getUserFromDB(id: string) {
  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
    columns: { id: true, email: true, role: true, name: true },
  });
}

// ____________________________________________________________________________________

// Using function overloading to define the return type of the "_getCurrentUser" function :
function _getCurrentUser(options: {
  withFullUser: true;
  redirectIfNotFound: true;
}): Promise<FullUser>;

function _getCurrentUser(options: {
  withFullUser: true;
  redirectIfNotFound?: false;
}): Promise<FullUser | null>;

function _getCurrentUser(options: {
  withFullUser?: false;
  redirectIfNotFound: true;
}): Promise<User>;

function _getCurrentUser(options?: {
  withFullUser?: false;
  redirectIfNotFound?: false;
}): Promise<User | null>;

// ____________________________________________________________________________________

async function _getCurrentUser({
  withFullUser = false,
  redirectIfNotFound = false,
} = {}) {
  const user = await getUserFromSession(await cookies());

  if (user == null) {
    if (redirectIfNotFound) return redirect("/sign-in");
    return null;
  }

  if (withFullUser) {
    const fullUser = await getUserFromDB(user.id);
    // This should never happen.
    if (fullUser == null) throw new Error("User not found in database");
    return fullUser;
  }

  return user;
}

export const getCurrentUser = cache(_getCurrentUser);

// ____________________________________________________________________________________

// Old method :
// export const getCurrentUser = cache(async () => {
//   return await getUserFromSession(await cookies());
// });
