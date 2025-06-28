import { Cookies } from "@/auth/types";
import { env } from "@/data/env/server";
import { z } from "zod";

// Custom error class extending from inbuilt Error class :
export class InvalidTokenError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid Token!!");
    this.cause = zodError;
  }
}

export class OAuthClient<T> {
  private readonly tokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
  });

  private get redirectUrl() {
    return new URL("discord", env.OAUTH_REDIRECT_URL_BASE);
  }

  // Step 1 : To get the code by sending them the Auth Url :
  createAuthUrl(cookies: Pick<Cookies, "set">) {
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
    url.searchParams.set("redirect_uri", this.redirectUrl.toString());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify email"); // What info you need discord to send it back to you?
    return url.toString();
  }

  // Step 2 : Use the code from step 1 to get our user Access Token :
  private fetchToken(code: string) {
    return fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: this.redirectUrl.toString(),
        grant_type: "authorization_code",
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
      }),
    })
      .then((res) => res.json())
      .then((rawData) => {
        // console.log(rawData);
        const { error, data, success } = this.tokenSchema.safeParse(rawData);

        if (!success) {
          throw new InvalidTokenError(error);
        }

        return {
          accessToken: data.access_token,
          tokenType: data.token_type,
        };
      });
  }

  async fetchUser(code: string) {
    const { accessToken, tokenType } = await this.fetchToken(code);
  }

  // Step 3 : To get the user information using the access token :
}
