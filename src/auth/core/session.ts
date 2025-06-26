import crypto from "crypto";
import { redisClient } from "@/redis/redis";
import { Cookies, UserSession } from "../types";
import { sessionSchema } from "./schemas";

// Session expiration :
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

// Session Key :
const COOKIE_SESSION_KEY = "custom-auth-session-id";

// __________________________________________________________________________________

export async function createUserSession(user: UserSession, cookies: Cookies) {
  // Creating a session id :
  const sessionId = crypto.randomBytes(512).toString("hex").normalize();

  // Store the session id in Redis :
  redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  });

  // Now set the generated session id into the cookies :
  setCookie(sessionId, cookies);
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000, // Since date returns in milliseconds, multiply by 1000
  });
}

// __________________________________________________________________________________

export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;

  if (sessionId == null) return null;

  return getUserSessionById(sessionId);
}

async function getUserSessionById(sessionId: string) {
  const rawUser = await redisClient.get(`session:${sessionId}`);
  
  const { success, data:user } = sessionSchema.safeParse(rawUser);

  return success ? user : null;
}
