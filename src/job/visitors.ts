import { chmod, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readAccessLogs, rollupAccessLog } from "../visitors/log.ts";

const logDir = process.env.ACCESS_LOG_DIR ?? "/var/log/nginx";
const outPath = process.env.VISITORS_OUT ?? "/var/www/html/data/visitors.json";
const mode = 0o640;

async function writeAtomic(target: string, body: string): Promise<void> {
  const temporary = join(target, "..", `.visitors.json.${process.pid}.tmp`);
  try {
    await writeFile(temporary, body, { mode });
    await chmod(temporary, mode);
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

const report = rollupAccessLog(readAccessLogs(logDir), new Date());
await writeAtomic(outPath, `${JSON.stringify(report)}\n`);
