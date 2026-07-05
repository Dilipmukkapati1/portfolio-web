import { afterEach, describe, expect, it, vi } from "vitest";
import { describeApiTarget, getWebEnv } from "./env.js";

describe("getWebEnv", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID;
  });

  it("defaults to development (dev Azure API) when NEXT_PUBLIC_APP_ENV is unset", () => {
    expect(getWebEnv().appEnv).toBe("development");
    expect(getWebEnv().apiUrl).toContain("ppm-dev-func");
  });

  it("uses local API when NEXT_PUBLIC_APP_ENV is local", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "local";
    expect(getWebEnv().appEnv).toBe("local");
    expect(getWebEnv().apiUrl).toBe("http://localhost:7071/api");
    expect(getWebEnv().defaultHouseholdId).toBe("dev-household");
  });

  it("uses NEXT_PUBLIC_API_URL when set", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:7071/api";
    expect(getWebEnv().apiUrl).toBe("http://localhost:7071/api");
  });

  it("ignores relative NEXT_PUBLIC_API_URL from a bad deploy", () => {
    process.env.NEXT_PUBLIC_API_URL = "/api";
    expect(getWebEnv().apiUrl).toContain("ppm-dev-func");
  });

  it("uses dev-household when the dev API URL is set without an explicit household", () => {
    process.env.NEXT_PUBLIC_API_URL =
      "https://ppm-dev-func-x32hrp.azurewebsites.net/api";
    expect(getWebEnv().defaultHouseholdId).toBe("dev-household");
  });

  it("corrects local-household when pointed at the dev API", () => {
    process.env.NEXT_PUBLIC_API_URL =
      "https://ppm-dev-func-x32hrp.azurewebsites.net/api";
    process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID = "local-household";
    expect(getWebEnv().defaultHouseholdId).toBe("dev-household");
  });

  it("rewrites prod API URL when served from dev Static Web App host", () => {
    vi.stubGlobal("window", {
      location: { hostname: "gray-wave-042dd9310.7.azurestaticapps.net" },
    });
    process.env.NEXT_PUBLIC_API_URL =
      "https://ppm-prod-func-x32hrp.azurewebsites.net/api";
    expect(getWebEnv().apiUrl).toContain("ppm-dev-func");
    vi.unstubAllGlobals();
  });

  it("describes API target from URL", () => {
    expect(describeApiTarget("http://localhost:7071/api")).toBe(
      "Local (portfolio-api)"
    );
    expect(
      describeApiTarget("https://ppm-dev-func-x32hrp.azurewebsites.net/api")
    ).toBe("Azure dev");
  });
});
