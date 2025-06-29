import { Cookies } from "@/auth/types";
import { env } from "@/data/env/server";
import crypto from "crypto";
import { tokenSchema, userSchema } from "../schemas";
import {
  InvalidCodeVerifierError,
  InvalidStateError,
  InvalidTokenError,
  InvalidUserError,
} from "./error";

// A state is a large string which we generate and send along the request url. The discord sends the same state back to us. We just need to make sure that, what we sent them is the same thing they sent back to us.

const STATE_COOKIE_KEY = "oAuthState";
const CODE_VERIFIER_COOKIE_KEY = "oAuthCodeVerifier";

// Ten minutes in seconds
const COOKIE_EXPIRATION_SECONDS = 60 * 10;

// A function for creating the state string :
function createState(cookies: Pick<Cookies, "set">) {
  // Create a state :
  const state = crypto.randomBytes(64).toString("hex").normalize();

  // Store the state in cookies :
  cookies.set(STATE_COOKIE_KEY, state, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
  });
  // console.log("State Generated by ME : ", state);
  return state;
}

// A function to validate the state :
function validateState(state: string, cookies: Pick<Cookies, "get">) {
  const cookieState = cookies.get(STATE_COOKIE_KEY)?.value;
  // console.log("State sent by Discord : ", cookieState);
  return cookieState === state;
}

//  A function for creating code verifier :
function createCodeVerifier(cookies: Pick<Cookies, "set">) {
  // Create a codeverifier string :
  const codeVerifier = crypto.randomBytes(64).toString("hex").normalize();

  // Store the codeVerifier in cookies :
  cookies.set(CODE_VERIFIER_COOKIE_KEY, codeVerifier, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
  });
  return codeVerifier;
}

// A function to get the code verifier from the OAuth provider :
function getCodeVerifier(cookies: Pick<Cookies, "get">) {
  const codeVerifier = cookies.get(CODE_VERIFIER_COOKIE_KEY)?.value;
  return codeVerifier;
}

export class OAuthClient<T> {
  private get redirectUrl() {
    return new URL("discord", env.OAUTH_REDIRECT_URL_BASE);
  }

  // Step 1 : To get the code by sending them the Auth Url :
  createAuthUrl(cookies: Pick<Cookies, "set">) {
    const state = createState(cookies);
    const codeVerifier = createCodeVerifier(cookies);
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
    url.searchParams.set("redirect_uri", this.redirectUrl.toString());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify email"); // What info you need discord to send it back to you?
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", state);
    url.searchParams.set(
      "code_challenge",
      crypto.hash("sha256", codeVerifier, "base64url")
    );
    return url.toString();
  }

  // Step 2 : Use the code from step 1 to get our user Access Token :
  private fetchToken(code: string, codeVerifier: string) {
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
        code_verifier: codeVerifier,
      }),
    })
      .then((res) => res.json())
      .then((rawData) => {
        // console.log(rawData);
        const { error, data, success } = tokenSchema.safeParse(rawData);

        if (!success) {
          throw new InvalidTokenError(error);
        }

        return {
          accessToken: data.access_token,
          tokenType: data.token_type,
        };
      });
  }

  async fetchUser(code: string, state: string, cookies: Pick<Cookies, "get">) {
    // To Validate the State :
    const isValidState = await validateState(state, cookies);
    if (!isValidState) throw new InvalidStateError();

    // To get the code verifier
    const codeVerifier = getCodeVerifier(cookies);
    if (!codeVerifier) throw new InvalidCodeVerifierError();

    const { accessToken, tokenType } = await this.fetchToken(
      code,
      codeVerifier
    );

    // Step 3 : To get the user information using the access token :
    const user = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((rawData) => {
        // console.log("Raw Data :", rawData);
        const { data, success, error } = userSchema.safeParse(rawData);

        if (!success) {
          throw new InvalidUserError(error);
        }

        return data;
      });

    return {
      id: user.id,
      name: user.global_name ?? user.username,
      email: user.email,
    };
  }
}
