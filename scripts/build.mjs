import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

const css = readFileSync(join(root, "src", "painter", "dashboard.css"), "utf8").replaceAll(
  "../../public/fonts/",
  "../fonts/",
);
if (
  css.includes("public/fonts") ||
  css.includes("fonts.googleapis.com") ||
  css.includes("fonts.gstatic.com") ||
  !css.includes('url("../fonts/geist-latin-400-normal.woff2")')
) {
  console.error("font css was not rewritten");
  process.exit(1);
}
writeFileSync(join(dist, "assets", "dashboard.css"), css);

const loading = readFileSync(join(root, "src", "painter", "loading.html"), "utf8");
writeFileSync(
  join(dist, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bitcoin dashboard</title>
<link rel="stylesheet" href="assets/dashboard.css">
</head>
<body>
<div class="page">
${loading}
</div>
<script type="module" src="assets/dashboard.js"></script>
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
