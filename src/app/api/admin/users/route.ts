import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAuthCredentials } from "@/lib/simple-auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creds = getAuthCredentials();
  return NextResponse.json({
    users: [
      {
        id: "local-user",
        email: `${creds.username}@local`,
        full_name: creds.displayName,
        avatar_url: null,
        role: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  });
}

export async function PATCH() {
  return NextResponse.json(
    { error: "User management is not available in simple auth mode" },
    { status: 501 }
  );
}
