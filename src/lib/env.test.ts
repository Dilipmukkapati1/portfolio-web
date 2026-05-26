import { describe, expect, it, afterEach } from "vitest";
import { getWebEnv } from "./env.js";

describe("getWebEnv", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID;
  });

  it("defaults to local when NEXT_PUBLIC_APP_ENV is unset", () => {
    expect(getWebEnv().appEnv).toBe("local");
    expect(getWebEnv().apiUrl).toBe("http://localhost:7071/api");
  });

  it("uses NEXT_PUBLIC_API_URL when set", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:7071/api";
    expect(getWebEnv().apiUrl).toBe("http://localhost:7071/api");
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
});
