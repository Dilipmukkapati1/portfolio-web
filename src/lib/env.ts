export type AppEnv = "local" | "development" | "production";

/** Dev Function App host fragment — household data (SimpleFIN) lives under dev-household. */
export const DEV_API_HOST_FRAGMENT = "ppm-dev-func";

/** Deployed dev API — used as the default for `npm run dev` when env files are missing. */
export const DEV_API_URL =
  "https://ppm-dev-func-x32hrp.azurewebsites.net/api";

const ENV_DEFAULTS = {
  local: {
    apiUrl: "http://localhost:7071/api",
    defaultHouseholdId: "local-household",
  },
  development: {
    apiUrl: DEV_API_URL,
    defaultHouseholdId: "dev-household",
  },
  production: {
    apiUrl: "https://YOUR-PROD-FUNCTION.azurewebsites.net/api",
    defaultHouseholdId: "prod-household",
  },
} as const;

function parseAppEnv(): AppEnv {
  // Do not use NODE_ENV — Next.js sets it to "development" during `next dev`.
  // Default to development (Azure dev API) so pages work without a local Function App.
  const raw = (process.env.NEXT_PUBLIC_APP_ENV ?? "development").toLowerCase();
  if (raw === "development" || raw === "dev") return "development";
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "local") return "local";
  return "development";
}

function resolveDefaultHouseholdId(
  appEnv: AppEnv,
  apiUrl: string,
  explicit?: string
): string {
  const trimmed = explicit?.trim();
  if (trimmed) {
    // Common local misconfig: dev API + local-household shows empty/wrong accounts.
    if (
      trimmed === "local-household" &&
      apiUrl.includes(DEV_API_HOST_FRAGMENT)
    ) {
      return "dev-household";
    }
    return trimmed;
  }
  if (apiUrl.includes(DEV_API_HOST_FRAGMENT)) return "dev-household";
  return ENV_DEFAULTS[appEnv].defaultHouseholdId;
}

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed directly (not process.env[name]).
 */
export function getWebEnv() {
  const appEnv = parseAppEnv();
  const defaults = ENV_DEFAULTS[appEnv];

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || defaults.apiUrl;
  const defaultHouseholdId = resolveDefaultHouseholdId(
    appEnv,
    apiUrl,
    process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID
  );

  return {
    appEnv,
    apiUrl,
    defaultHouseholdId,
  };
}

export const webEnv = getWebEnv();
