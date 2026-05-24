export const SESSION_COOKIE = "portfolio-session";

export function getAuthCredentials() {
  return {
    username: process.env.AUTH_USERNAME ?? "admin",
    password: process.env.AUTH_PASSWORD ?? "portfolio",
    displayName: process.env.AUTH_DISPLAY_NAME ?? "Admin",
  };
}

export function getSessionToken(): string {
  const secret = process.env.AUTH_SECRET ?? "portfolio-dev-secret";
  return `portfolio-session-${secret}`;
}

export function isValidSession(value: string | undefined): boolean {
  if (!value) return false;
  return value === getSessionToken();
}

export function getClientDisplayUser() {
  return {
    username: process.env.NEXT_PUBLIC_AUTH_USERNAME ?? "admin",
    displayName: process.env.NEXT_PUBLIC_AUTH_DISPLAY_NAME ?? "Admin",
  };
}

export function validateCredentials(
  username: string,
  password: string
): boolean {
  const creds = getAuthCredentials();
  return username === creds.username && password === creds.password;
}
