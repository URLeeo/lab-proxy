import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "token";
const AUTH_API_URL = "http://localhost:8080/api/me";

function redirectToAuth(request) {
  return NextResponse.redirect(new URL("/auth", request.url));
}

function redirectHome(request) {
  return NextResponse.redirect(new URL("/", request.url));
}

export async function proxy(request) {
  const cookieHeader = request.headers.get("cookie");
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!cookieHeader || !authCookie) {
    return redirectToAuth(request);
  }

  let response;

  try {
    response = await fetch(AUTH_API_URL, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    return redirectToAuth(request);
  }

  if (!response.ok) {
    return redirectToAuth(request);
  }

  const user = await response.json();
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && user?.role !== "ADMIN") {
    return redirectHome(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
