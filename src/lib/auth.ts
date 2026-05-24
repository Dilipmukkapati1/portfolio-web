import { cookies } from "next/headers";
import {
  getAuthCredentials,
  isValidSession,
  SESSION_COOKIE,
} from "@/lib/simple-auth";

export interface SessionUser {
  username: string;
  displayName: string;
  role: "admin";
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!(await isAuthenticated())) return null;

  const creds = getAuthCredentials();
  return {
    username: creds.username,
    displayName: creds.displayName,
    role: "admin",
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireAuth();
}
