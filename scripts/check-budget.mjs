import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const MARKET_HOSTS = ["coingecko", "coinmetrics", "coinmarketcap", "binance.com", "kraken.com", "coinbase.com"];
// The footer links to this repository. Any other remote URL stays out of This week.
const REPO_HREF = "https://github.com/rkalla/btc-insights";
const LIMIT = 51200;

function walk(dir, files) {
  for (const name of readdirSync(dir)) {
    if (dir === dist && name === "fonts") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path, files);
      continue;
    }
    const ext = extname(path);
    if (ext === ".html" || ext === ".css" || ext === ".js") files.push(path);
  }
}

function insideDist(path) {
  const full = normalize(path);
  return full === dist || full.startsWith(dist + sep);
}

function assetPath(htmlPath, ref) {
  if (ref.startsWith("http://") || ref.startsWith("https://") || ref.startsWith("//")) return null;
  if (!ref.endsWith(".css") && !ref.endsWith(".js")) return null;
  const full = ref.startsWith("/") ? join(dist, ref.slice(1)) : normalize(join(dirname(htmlPath), ref));
  if (!insideDist(full)) return null;
  return full;
}

function isWeekBundle(path) {
  const rel = relative(dist, path).split(sep).join("/");
  return rel === "index.html" || rel === "this-week/index.html" || rel === "assets/site.css" || rel === "assets/this-week.css" || rel === "assets/this-week.js";
}

const files = [];
walk(dist, files);
const htmlFiles = files.filter((path) => extname(path) === ".html");
if (htmlFiles.length === 0) {
  console.error("no html pages");
  process.exit(1);
}

for (const path of files) {
  const text = readFileSync(path, "utf8");
  for (const host of FONT_HOSTS) {
    if (text.includes(host)) {
      console.error(`${path} references a font host`);
      process.exit(1);
    }
  }
  if (!isWeekBundle(path)) continue;
  const lower = text.toLowerCase();
  for (const host of MARKET_HOSTS) {
    if (lower.includes(host)) {
      console.error(`${path} names a market host`);
      process.exit(1);
    }
  }
  const pageText = lower.split(REPO_HREF).join("");
  if (pageText.includes("https://") || pageText.includes("http://")) {
    console.error(`${path} contains a remote url`);
    process.exit(1);
  }
}

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, "utf8");
  const seen = new Set([htmlPath]);
  let total = gzipSync(html).length;
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const asset = assetPath(htmlPath, match[1]);
    if (asset == null || seen.has(asset)) continue;
    seen.add(asset);
    total += gzipSync(readFileSync(asset)).length;
  }
  const label = relative(dist, htmlPath).split(sep).join("/");
  console.log(`gzip page ${label} ${total}`);
  if (total > LIMIT) {
    console.error(`gzip page ${label} ${total} exceeds ${LIMIT}`);
    process.exit(1);
  }
}
