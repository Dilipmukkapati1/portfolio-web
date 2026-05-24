export type AppEnv = "local" | "development" | "production";

const ENV_DEFAULTS = {
  local: {
    apiUrl: "http://localhost:7071/api",
    defaultHouseholdId: "local-household",
  },
  development: {
    apiUrl: "https://YOUR-DEV-FUNCTION.azurewebsites.net/api",
    defaultHouseholdId: "dev-household",
  },
  production: {
    apiUrl: "https://YOUR-PROD-FUNCTION.azurewebsites.net/api",
    defaultHouseholdId: "prod-household",
  },
} as const;

function parseAppEnv(): AppEnv {
  // Do not use NODE_ENV — Next.js sets it to "development" during `next dev`.
  const raw = (process.env.NEXT_PUBLIC_APP_ENV ?? "local").toLowerCase();
  if (raw === "development" || raw === "dev") return "development";
  if (raw === "production" || raw === "prod") return "production";
  return "local";
}

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed directly (not process.env[name]).
 */
export function getWebEnv() {
  const appEnv = parseAppEnv();
  const defaults = ENV_DEFAULTS[appEnv];

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || defaults.apiUrl;
  const defaultHouseholdId =
    process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID?.trim() ||
    defaults.defaultHouseholdId;

  return {
    appEnv,
    apiUrl,
    defaultHouseholdId,
  };
}

export const webEnv = getWebEnv();
