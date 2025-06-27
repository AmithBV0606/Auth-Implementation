import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getUserFromSession,
  updateUserSessionExpiration,
} from "./auth/core/session";

const privateRoutes = ["/private"];
const adminRoutes = ["/admin"];

async function middlewareAuth(request: NextRequest) {
  // To Check if we're on private or admin route :
  if (privateRoutes.includes(request.nextUrl.pathname)) {
    const user = await getUserFromSession(request.cookies);
    // If there is no cookies or user :
    if (user == null) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (adminRoutes.includes(request.nextUrl.pathname)) {
    const user = await getUserFromSession(request.cookies);
    // If there is no cookies or user :
    if (user == null) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (user.role != "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
}

export async function middleware(request: NextRequest) {
  const response = (await middlewareAuth(request)) ?? NextResponse.next();

  // We need to set the cookie that we get from request onto the response :
  await updateUserSessionExpiration({
    set: (key, value, options) => {
      response.cookies.set({ ...options, name: key, value });
    },
    get: (key) => request.cookies.get(key),
  });

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
