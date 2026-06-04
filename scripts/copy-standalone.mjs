import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next/standalone");

if (!existsSync(standaloneDir)) {
  console.error(
    "Missing .next/standalone. Set output: \"standalone\" in next.config and run next build first."
  );
  process.exit(1);
}

cpSync(join(root, ".next/static"), join(standaloneDir, ".next/static"), {
  recursive: true,
});
cpSync(join(root, "public"), join(standaloneDir, "public"), { recursive: true });

console.log("Copied .next/static and public into .next/standalone");
