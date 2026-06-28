#!/usr/bin/env node
/**
 * Start Next.js dev server against local portfolio-api or the deployed Azure dev API.
 *
 * Usage:
 *   node scripts/dev.mjs              # Azure dev API (default)
 *   node scripts/dev.mjs --local      # localhost:7071
 *   node scripts/dev.mjs --azure-dev  # explicit Azure dev
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const AZURE_DEV_API_URL =
  "https://ppm-dev-func-x32hrp.azurewebsites.net/api";

const TARGETS = {
  local: {
    label: "local portfolio-api",
    apiUrl: "http://localhost:7071/api",
    env: {
      NEXT_PUBLIC_APP_ENV: "local",
      NEXT_PUBLIC_API_URL: "http://localhost:7071/api",
      NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID: "dev-household",
    },
  },
  "azure-dev": {
    label: "Azure dev API",
    apiUrl: AZURE_DEV_API_URL,
    env: {
      NEXT_PUBLIC_APP_ENV: "development",
      NEXT_PUBLIC_API_URL: AZURE_DEV_API_URL,
      NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID: "dev-household",
    },
  },
};

function parseTarget() {
  if (args.includes("--local")) return "local";
  if (args.includes("--azure-dev") || args.includes("--azure")) {
    return "azure-dev";
  }
  return "azure-dev";
}

async function warnIfLocalApiDown() {
  try {
    const res = await fetch("http://localhost:7071/api/health", {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) {
      console.warn(
        "[portfolio-web] portfolio-api responded with HTTP",
        res.status,
        "— start it with: cd ../portfolio-api && npm start"
      );
    }
  } catch {
    console.warn(
      "[portfolio-web] portfolio-api is not reachable on localhost:7071.\n" +
        "  Start it: cd ../portfolio-api && npm start\n" +
        "  Or use Azure dev API: npm run dev:azure"
    );
  }
}

function resolvePort() {
  const portFlag = args.findIndex((a) => a === "-p" || a === "--port");
  if (portFlag >= 0 && args[portFlag + 1]) {
    return args[portFlag + 1];
  }
  return process.env.PORT?.trim() || "3000";
}

function buildContracts() {
  const contractsRoot = path.resolve(root, "..", "portfolio-contracts");
  console.log("[portfolio-web] Building @portfolio/contracts…");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: contractsRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("[portfolio-web] Failed to build @portfolio/contracts.");
    process.exit(result.status ?? 1);
  }
}

async function main() {
  buildContracts();

  const targetKey = parseTarget();
  const target = TARGETS[targetKey];
  const port = resolvePort();

  if (targetKey === "azure-dev" && port !== "3000") {
    console.warn(
      `[portfolio-web] Dev Azure API CORS allows http://localhost:3000 only. Port ${port} may be blocked.`
    );
  }

  console.log(
    `[portfolio-web] API target: ${target.label}\n` +
      `  ${target.apiUrl}\n` +
      `  http://localhost:${port}`
  );

  if (targetKey === "local") {
    await warnIfLocalApiDown();
  }

  const nextBin = path.join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "next.cmd" : "next"
  );
  if (!fs.existsSync(nextBin)) {
    console.error("[portfolio-web] Run npm install first.");
    process.exit(1);
  }

  const nextArgs = ["dev", "-p", port];
  const child = spawn(nextBin, nextArgs, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      ...target.env,
      NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[portfolio-web]", err);
  process.exit(1);
});
