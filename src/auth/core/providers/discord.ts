import { env } from "@/data/env/server";
import { OAuthClient } from "../oauth/base";
import { userSchema } from "../schemas";
import { z } from "zod";

export function createDiscordOAuthClient() {
  return new OAuthClient({
    provider: "discord",
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    scopes: ["identify", "email"],
    urls: {
      auth: "https://discord.com/oauth2/authorize",
      token: "https://discord.com/api/oauth2/token",
      user: "https://discord.com/api/users/@me",
    },
    userInfo: {
      schema: userSchema,
      parser: (user) => ({
        id: user.id,
        name: user.global_name ?? user.username,
        email: user.email,
      }),
    },
  });
}
