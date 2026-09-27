import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (dir === dist && name === "fonts") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    const ext = extname(path);
    if (ext === ".html" || ext === ".css" || ext === ".js") files.push(path);
  }
}

walk(dist);
let total = 0;
for (const path of files) {
  total += gzipSync(readFileSync(path)).length;
}

const index = readFileSync(join(dist, "index.html"), "utf8");
if (index.includes("fonts.googleapis.com") || index.includes("fonts.gstatic.com")) {
  console.error("index.html references a font host");
  process.exit(1);
}

console.log(`gzip total ${total}`);
if (total > 51200) {
  console.error(`gzip total ${total} exceeds 51200`);
  process.exit(1);
}
