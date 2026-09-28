import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteHeader } from "../src/painter/site-header.ts";
import { thisWeekShell } from "../src/painter/this-week.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "assets"), { recursive: true });
mkdirSync(join(dist, "fonts"), { recursive: true });

const fonts = [
  "geist-latin-400-normal.woff2",
  "geist-latin-500-normal.woff2",
  "geist-latin-600-normal.woff2",
  "geist-latin-700-normal.woff2",
  "geist-mono-latin-400-normal.woff2",
  "geist-mono-latin-500-normal.woff2",
  "geist-mono-latin-600-normal.woff2",
];

for (const name of fonts) {
  const from = join(root, "public", "fonts", name);
  try {
    copyFileSync(from, join(dist, "fonts", name));
  } catch {
    console.error(`missing font ${name}`);
    process.exit(1);
  }
}

const icons = ["favicon.ico", "favicon-32.png", "apple-touch-icon.png"];
for (const name of icons) {
  try {
    copyFileSync(join(root, "public", name), join(dist, name));
  } catch {
    console.error(`missing icon ${name}`);
    process.exit(1);
  }
}

const iconLinks = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`;

function writeCss(name) {
  const css = readFileSync(join(root, "src", "painter", name), "utf8").replaceAll(
    "../../public/fonts/",
    "../fonts/",
  );
  if (
    css.includes("public/fonts") ||
    css.includes("fonts.googleapis.com") ||
    css.includes("fonts.gstatic.com") ||
    !css.includes('url("../fonts/geist-latin-400-normal.woff2")')
  ) {
    console.error(`font css was not rewritten for ${name}`);
    process.exit(1);
  }
  if (name === "this-week.css") {
    if (css.includes("geist-mono") || css.includes("monospace") || css.includes("650")) {
      console.error("this week css uses a forbidden face or weight");
      process.exit(1);
    }
    if (/\bred\b|\bgreen\b|#f00\b|#0f0\b|#ff0000\b|#00ff00\b/i.test(css)) {
      console.error("this week css uses red or green");
      process.exit(1);
    }
  }
  writeFileSync(join(dist, "assets", name), css);
}

writeCss("dashboard.css");
writeCss("this-week.css");

const loading = readFileSync(join(root, "src", "painter", "loading.html"), "utf8");
writeFileSync(join(dist, "index.html"), thisWeekShell(iconLinks));

mkdirSync(join(dist, "this-week"), { recursive: true });
writeFileSync(join(dist, "this-week", "index.html"), thisWeekShell(iconLinks));

mkdirSync(join(dist, "evidence"), { recursive: true });
writeFileSync(
  join(dist, "evidence", "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Evidence · BTC Friday</title>
${iconLinks}
<link rel="stylesheet" href="/assets/dashboard.css">
</head>
<body>
<div class="page">
${siteHeader("evidence")}
${loading}
</div>
<script type="module" src="/assets/dashboard.js"></script>
</body>
</html>
`,
);

writeFileSync(
  join(dist, "settings.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bitcoin dashboard · Settings</title>
${iconLinks}
<link rel="stylesheet" href="assets/dashboard.css">
</head>
<body>
<script type="module" src="assets/settings.js"></script>
</body>
</html>
`,
);

await esbuild.build({
  entryPoints: {
    dashboard: join(root, "src", "client", "dashboard.ts"),
    settings: join(root, "src", "client", "settings.ts"),
    "this-week": join(root, "src", "client", "this-week.ts"),
  },
  bundle: true,
  format: "esm",
  target: "es2022",
  outdir: join(dist, "assets"),
  minify: true,
  legalComments: "none",
  sourcemap: false,
});

await esbuild.build({
  entryPoints: [join(root, "src", "job", "run.ts")],
  outfile: join(root, "job", "run.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  packages: "external",
});

console.log("build: ok");
