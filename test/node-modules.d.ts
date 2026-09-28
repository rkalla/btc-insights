declare module "node:assert/strict" {
  interface Assert {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    match(actual: string, expected: RegExp, message?: string): void;
    ok(value: unknown, message?: string): void;
  }
  const assert: Assert;
  export default assert;
}

declare module "node:fs" {
  export function readFileSync(path: URL | string, encoding: "utf8"): string;
  export function readdirSync(path: URL | string): string[];
  export function statSync(path: string | URL): {
    mode: number;
    mtimeMs: number;
    size: number;
    isDirectory(): boolean;
  };
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string): void;
  export function mkdtempSync(path: string): string;
  export function rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
  export function writeFileSync(path: string, data: string): void;
  export function utimesSync(path: string, atime: Date, mtime: Date): void;
  export function chmodSync(path: string, mode: number): void;
}

declare module "node:fs/promises" {
  export function stat(path: string): Promise<{ isDirectory(): boolean }>;
  export function readFile(path: string, encoding: "utf8"): Promise<string>;
  export function writeFile(
    path: string,
    data: string,
    options?: { mode?: number; flag?: "w" | "wx" },
  ): Promise<void>;
  export function chmod(path: string, mode: number): Promise<void>;
  export function rename(from: string, to: string): Promise<void>;
  export function rm(path: string, options?: { force?: boolean }): Promise<void>;
  export function realpath(path: string): Promise<string>;
}

declare module "node:crypto" {
  interface Hash {
    update(data: string): Hash;
    digest(encoding: "hex"): string;
  }
  export function createHash(algorithm: "sha256"): Hash;
}

declare module "node:test" {
  function test(name: string, fn: () => void | Promise<void>): void;
  export default test;
  export { test };
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function relative(from: string, to: string): string;
  export function dirname(path: string): string;
}

declare module "node:os" {
  export function tmpdir(): string;
}

declare module "node:url" {
  export function pathToFileURL(path: string): URL;
  export function fileURLToPath(url: URL | string): string;
}

declare module "node:timers/promises" {
  export function setTimeout(ms: number): Promise<void>;
}

declare module "node:http" {
  interface IncomingMessage {
    url?: string;
    headers: Record<string, string | string[] | undefined>;
  }
  interface ServerResponse {
    statusCode: number;
    setHeader(name: string, value: string): void;
    end(body?: string): void;
  }
  interface Server {
    listen(port: number, host: string, callback: () => void): void;
    address(): { port: number } | string | null;
    close(callback: () => void): void;
    closeAllConnections(): void;
  }
  export function createServer(
    handler: (req: IncomingMessage, res: ServerResponse) => void,
  ): Server;
}

declare module "node:child_process" {
  interface ChildProcess {
    stderr: {
      setEncoding(encoding: "utf8"): void;
      on(event: "data", listener: (chunk: string) => void): void;
    };
    kill(): void;
    on(event: "error", listener: (error: Error) => void): void;
    on(event: "close", listener: (code: number | null) => void): void;
  }
  export function spawn(
    command: string,
    args: readonly string[],
    options: {
      cwd: string;
      env: Record<string, string>;
      stdio: ["ignore", "ignore", "pipe"];
    },
  ): ChildProcess;
  export function execFileSync(
    file: string,
    args: readonly string[],
    options: { cwd: string; encoding: "utf8"; maxBuffer?: number },
  ): string;
}

interface ImportMeta {
  readonly url: string;
}

// URL is a Node global. The esnext lib does not declare it, and this repo has no @types/node.
interface URL {
  readonly href: string;
}

declare const URL: {
  new (input: string | URL, base?: string | URL): URL;
};

declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  execPath: string;
  pid: number;
  kill(pid: number, signal?: number): boolean;
  umask(mask: number): number;
  exit(code: number): never;
  stderr: { write(chunk: string): void };
};

declare function fetch(
  url: string,
  init?: { headers?: Record<string, string> },
): Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(handle: unknown): void;

declare module "node:zlib" {
  export function gzipSync(data: string): { readonly length: number };
}
