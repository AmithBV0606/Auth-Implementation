import crypto from "crypto";
import { redisClient } from "@/redis/redis";
import { Cookies, UserSession } from "../types";
import { sessionSchema } from "./schemas";

// Session expiration :
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

// Session Key :
const COOKIE_SESSION_KEY = "custom-auth-session-id";

export async function createUserSession(user: UserSession, cookies: Cookies) {
  // Creating a session id :
  const sessionId = crypto.randomBytes(512).toString("hex").normalize();

  // Store the session id in Redis :
  redisClient.set(`session:${sessionId}`, sessionSchema.safeParse(user), {
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
