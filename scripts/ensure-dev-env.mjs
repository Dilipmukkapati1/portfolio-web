#!/usr/bin/env node
/**
 * Ensures .env.local exists with auth credentials for `npm run dev`.
 * Does not overwrite an existing .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = path.join(root, ".env.local");
const template = path.join(root, "env/azure-dev.env.example");

if (fs.existsSync(envLocal)) {
  process.exit(0);
}

if (!fs.existsSync(template)) {
  console.warn("[portfolio-web] Missing env/azure-dev.env.example");
  process.exit(0);
}

fs.copyFileSync(template, envLocal);
console.log(
  "[portfolio-web] Created .env.local from env/azure-dev.env.example (auth only).\n" +
    "  npm run dev        → Azure dev API\n" +
    "  npm run dev:local  → local portfolio-api on :7071"
);
