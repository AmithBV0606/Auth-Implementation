import { z } from "zod";
import { sessionSchema } from "../core/schemas";
import { OAuthProvider } from "@/drizzle/schema";

export type UserSession = z.infer<typeof sessionSchema>;

// Since we're making the "core" section independent of NextJs :
export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

export type ComparePassword = {
  password: string;
  salt: string;
  hashedPassword: string;
};

export type OAuthUser = {
  id: string;
  name: string;
  email: string;
};

export type GenericTypeProps<T> = {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  urls: {
    auth: string;
    token: string;
    user: string;
  };
  userInfo: {
    schema: z.ZodSchema<T>;
    parser: (data: T) => { id: string; email: string; name: string };
  };
};
