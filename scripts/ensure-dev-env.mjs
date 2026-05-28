#!/usr/bin/env node
/**
 * Ensures .env.local exists for `npm run dev` when developers have no env file yet.
 * Does not overwrite an existing .env.local (you may need to update it manually).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = path.join(root, ".env.local");
const template = path.join(root, "env/local-against-dev.env.example");

if (fs.existsSync(envLocal)) {
  const text = fs.readFileSync(envLocal, "utf8");
  if (text.includes("localhost:7071")) {
    console.warn(
      "[portfolio-web] .env.local points at localhost:7071. Architect/Analyzer need portfolio-api running, or use the dev API:\n" +
        "  cp env/local-against-dev.env.example .env.local\n" +
        "  npm run dev"
    );
  }
  process.exit(0);
}

if (!fs.existsSync(template)) {
  console.warn("[portfolio-web] Missing env/local-against-dev.env.example");
  process.exit(0);
}

fs.copyFileSync(template, envLocal);
console.log(
  "[portfolio-web] Created .env.local from env/local-against-dev.env.example (dev Azure API)."
);
