import { defineConfig } from "vitest/config";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** The commit this build came from: Vercel provides it, and locally we ask git. */
function commit(): string {
  const v = process.env.VERCEL_GIT_COMMIT_SHA;
  if (v) return v.slice(0, 7);
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return "local"; }
}
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  // stamped into the page at build time, so Settings can say which version you're running
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commit()),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
  },
  test: { include: ["src/**/*.test.ts"] },
});
