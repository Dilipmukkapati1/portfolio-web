export type AppEnv = "local" | "development" | "production";

/** Dev Function App host fragment — household data (SimpleFIN) lives under dev-household. */
export const DEV_API_HOST_FRAGMENT = "ppm-dev-func";

/** Deployed dev API — used as the default for `npm run dev` when env files are missing. */
export const DEV_API_URL =
  "https://ppm-dev-func-x32hrp.azurewebsites.net/api";

export function isLocalApiUrl(apiUrl: string): boolean {
  return (
    apiUrl.includes("localhost") ||
    apiUrl.includes("127.0.0.1") ||
    apiUrl.startsWith("http://[::1]")
  );
}

export function describeApiTarget(apiUrl: string): string {
  if (isLocalApiUrl(apiUrl)) return "Local (portfolio-api)";
  if (apiUrl.includes(DEV_API_HOST_FRAGMENT)) return "Azure dev";
  if (apiUrl.includes("azurewebsites.net")) return "Azure";
  return "Custom";
}

const ENV_DEFAULTS = {
  local: {
    apiUrl: "http://localhost:7071/api",
    defaultHouseholdId: "dev-household",
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

/** Dev SWA hostnames — prod builds must not be served here (separate deploy tokens). */
const DEV_SWA_HOST_MARKERS = ["gray-wave-", "ppm-dev-web"] as const;

function isDevStaticWebHost(hostname: string): boolean {
  return DEV_SWA_HOST_MARKERS.some((marker) => hostname.includes(marker));
}

/** Recover when a prod build was accidentally uploaded to the dev Static Web App. */
function apiUrlForBrowserHost(candidate: string): string {
  if (typeof window === "undefined") return candidate;
  const host = window.location.hostname;
  if (isDevStaticWebHost(host) && candidate.includes("ppm-prod-func")) {
    return DEV_API_URL;
  }
  return candidate;
}

/** Ignore CI misconfig (e.g. empty DEV_FUNCTION_APP_URL → "/api"). */
function resolveApiUrl(appEnv: AppEnv, explicit?: string): string {
  const trimmed = explicit?.trim();
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return apiUrlForBrowserHost(trimmed);
  }
  const fallback = ENV_DEFAULTS[appEnv].apiUrl;
  return apiUrlForBrowserHost(fallback);
}

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

  const apiUrl = resolveApiUrl(
    appEnv,
    process.env.NEXT_PUBLIC_API_URL
  );
  const defaultHouseholdId = resolveDefaultHouseholdId(
    appEnv,
    apiUrl,
    process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID
  );

  return {
    appEnv,
    apiUrl,
    defaultHouseholdId,
    apiTarget: describeApiTarget(apiUrl),
    isLocalApi: isLocalApiUrl(apiUrl),
  };
}

export const webEnv = getWebEnv();
