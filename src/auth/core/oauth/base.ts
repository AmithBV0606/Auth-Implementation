import { Cookies, GenericTypeProps } from "@/auth/types";
import { env } from "@/data/env/server";
import crypto from "crypto";
import { tokenSchema } from "../schemas";
import {
  InvalidCodeVerifierError,
  InvalidStateError,
  InvalidTokenError,
  InvalidUserError,
} from "./error";
import { OAuthProvider } from "@/drizzle/schema";
import { z } from "zod";
import {
  createCodeVerifier,
  createState,
  getCodeVerifier,
  validateState,
} from "../oauth-security/helper";

export class OAuthClient<T> {
  private readonly provider: OAuthProvider;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly urls: {
    auth: string;
    token: string;
    user: string;
  };
  private readonly userInfo: {
    schema: z.ZodSchema<T>;
    parser: (data: T) => { id: string; email: string; name: string };
  };

  constructor({
    provider,
    clientId,
    clientSecret,
    scopes,
    urls,
    userInfo,
  }: GenericTypeProps<T>) {
    this.provider = provider;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
    this.userInfo = userInfo;
  }

  private get redirectUrl() {
    return new URL(this.provider, env.OAUTH_REDIRECT_URL_BASE);
  }

  // Step 1 : To get the code by sending them the Auth Url :
  createAuthUrl(cookies: Pick<Cookies, "set">) {
    const state = createState(cookies);
    const codeVerifier = createCodeVerifier(cookies);
    const url = new URL(this.urls.auth);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUrl.toString());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scopes.join(" ")); // What info you need discord to send it back to you?
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
    return fetch(this.urls.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: this.redirectUrl.toString(),
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
    const user = await fetch(this.urls.user, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((rawData) => {
        // console.log("Raw Data :", rawData);
        const { data, success, error } =
          this.userInfo.schema.safeParse(rawData);

        if (!success) {
          throw new InvalidUserError(error);
        }

        return data;
      });

    return this.userInfo.parser(user);
  }
}
