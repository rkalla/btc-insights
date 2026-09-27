declare module "node:assert/strict" {
  interface Assert {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
  }
  const assert: Assert;
  export default assert;
}

declare module "node:fs" {
  export function readFileSync(path: URL | string, encoding: "utf8"): string;
  export function readdirSync(path: URL | string): string[];
}

declare module "node:crypto" {
  interface Hash {
    update(data: string): Hash;
    digest(encoding: "hex"): string;
  }
  export function createHash(algorithm: "sha256"): Hash;
}

declare module "node:test" {
  export function test(name: string, fn: () => void | Promise<void>): void;
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
