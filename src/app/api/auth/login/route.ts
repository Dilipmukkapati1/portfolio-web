import { NextResponse } from "next/server";
import {
  getAuthCredentials,
  getSessionToken,
  SESSION_COOKIE,
  validateCredentials,
} from "@/lib/simple-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!validateCredentials(username, password)) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const creds = getAuthCredentials();
  const response = NextResponse.json({
    ok: true,
    user: { username: creds.username, displayName: creds.displayName },
  });

  response.cookies.set(SESSION_COOKIE, getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
