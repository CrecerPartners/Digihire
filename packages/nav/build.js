import { copyFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const targets = [
  "apps/landing/public",
  "apps/voltsquad/public",
  "apps/brands/public",
  "apps/talentpool/public",
  "apps/admin/public",
  "public",
];

const files = ["nav-partial.html", "nav-loader.js", "footer-partial.html", "footer-loader.js"];

for (const target of targets) {
  const dest = resolve(root, target);
  mkdirSync(dest, { recursive: true });
  for (const file of files) {
    copyFileSync(resolve(__dirname, "src", file), resolve(dest, file));
    console.log(`synced ${file} → ${target}`);
  }
}
