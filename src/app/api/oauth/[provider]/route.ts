import { OAuthClient } from "@/auth/core/oauth/base";
import { oAuthProviders } from "@/drizzle/schema";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params; // discord/github/google

  const code = request.nextUrl.searchParams.get("code");
  const provider = z.enum(oAuthProviders).parse(rawProvider);

  if (typeof code !== "string") {
    redirect(
      `/sign-in?oauthError=${encodeURIComponent(
        "Failed to connect. Please try again!!"
      )}`
    );
  }

  // Using the code we received from Discord/GitHub/Google, Fetch the user :
  const user = await new OAuthClient().fetchUser(code);
  //   console.log(user);
  //   return NextResponse.json({ status: 200 });
}
