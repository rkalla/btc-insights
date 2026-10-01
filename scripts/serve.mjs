import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const port = Number(process.env.PORT ?? 4173);
const host = "127.0.0.1";

const fixtures = new Map([
  ["/data/friday.json", join(root, "fixtures", "friday-2026-09-25.json")],
  ["/data/live.json", join(root, "fixtures", "live-2026-09-25.json")],
  ["/data/visitors.json", join(root, "fixtures", "visitors.json")],
]);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".woff2", "font/woff2"],
]);

function distFile(pathname) {
  let rel = pathname.replace(/^\/+/, "");
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  const full = normalize(join(dist, rel));
  if (full !== dist && !full.startsWith(dist + sep)) return null;
  return full;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${host}`);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === "/this-week") {
    res.writeHead(308, { location: "/this-week/" });
    res.end();
    return;
  }
  if (pathname === "/evidence") {
    res.writeHead(308, { location: "/evidence/" });
    res.end();
    return;
  }
  if (pathname === "/visitors") {
    res.writeHead(308, { location: "/visitors/" });
    res.end();
    return;
  }
  const fixture = fixtures.get(pathname);
  const filePath = fixture ?? distFile(pathname);
  if (filePath == null) {
    res.writeHead(403);
    res.end();
    return;
  }
  readFile(filePath)
    .then((body) => {
      const type = fixture != null
        ? "application/json; charset=utf-8"
        : (types.get(extname(filePath)) ?? "application/octet-stream");
      const cache = fixture != null ? "no-store" : "public, max-age=60";
      res.writeHead(200, { "content-type": type, "cache-control": cache });
      res.end(body);
    })
    .catch(() => {
      res.writeHead(404);
      res.end();
    });
});

server.listen(port, host, () => {
  console.log(`http://${host}:${port}`);
});
