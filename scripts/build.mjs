import { build } from "esbuild";

await build({
  entryPoints: ["src/job/run.ts"],
  outfile: "job/run.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  packages: "external",
});

console.log("build: ok");
