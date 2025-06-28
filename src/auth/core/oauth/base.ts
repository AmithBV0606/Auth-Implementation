import { Cookies } from "@/auth/types";
import { env } from "@/data/env/server";

export class OAuthClient<T> {
  private get redirectUrl() {
    return new URL("discord", env.OAUTH_REDIRECT_URL_BASE);
  }

  // Step 1 :
  createAuthUrl(cookies: Pick<Cookies, "set">) {
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
    url.searchParams.set("redirect_uri", this.redirectUrl.toString());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify email"); // What info you need discord to send it back to you?
    return url.toString();
  }
}
