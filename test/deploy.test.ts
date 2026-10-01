import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function read(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const site = read("../scripts/deploy-site.sh");
const job = read("../scripts/deploy-job.sh");
const liveService = read("../deploy/btc-insights-live.service");
const liveTimer = read("../deploy/btc-insights-live.timer");
const fridayService = read("../deploy/btc-insights-friday.service");
const fridayTimer = read("../deploy/btc-insights-friday.timer");
const visitorsService = read("../deploy/btc-insights-visitors.service");
const visitorsTimer = read("../deploy/btc-insights-visitors.timer");
const visitorsNginx = read("../deploy/nginx/visitors.conf");
const logFormat = read("../deploy/nginx/log-format.conf");
const scripts = [site, job];
const units = [liveService, liveTimer, fridayService, fridayTimer, visitorsService, visitorsTimer];

test("deploy scripts keep the locked web root", () => {
  for (const source of scripts) {
    assert.equal(source.includes("delete-excluded"), false);
    assert.equal(/chmod\s+664\b/.test(source), false);
    assert.equal(/chmod\s+666\b/.test(source), false);
    assert.equal(/chmod\s+777\b/.test(source), false);
    assert.equal(/\bchown\b[^\n]*\bwww-data\b/.test(source), false);
    assert.equal(/\bdocker\b/i.test(source), false);
  }
  assert.equal(site.includes("--no-perms"), true);
  assert.equal(site.includes("--no-group"), true);
  assert.equal(site.includes("--exclude data/"), true);
  assert.equal(site.includes("--delete "), true);
  assert.equal(site.includes("chmod 2750"), true);
  assert.equal(site.includes("chmod 640"), true);
  assert.equal(site.includes("echo locked"), true);
  assert.equal(job.includes("--delete"), false);
  assert.equal(job.includes("job/run.mjs"), true);
  assert.equal(job.includes("btcfriday.exe.xyz:/home/exedev/btc-insights/job/"), true);
  assert.equal(job.includes("--exclude .env"), true);
  assert.equal(job.includes("job/visitors.mjs"), true);
});

test("the deploy test does not run ssh", () => {
  const source = read("./deploy.test.ts");
  assert.equal(source.includes("node:" + "child_process"), false);
  assert.equal(/\b(exec|execSync|spawn|spawnSync|execFile|execFileSync)\(/.test(source), false);
});

test("host units run as exedev on the locked schedules", () => {
  for (const unit of units) {
    assert.equal(unit.includes("User=exedev"), true);
    assert.equal(unit.includes("User=www-data"), false);
    assert.equal(unit.includes("User=root"), false);
    assert.equal(unit.includes("WantedBy="), false);
  }
  assert.equal(/^User=exedev$/m.test(liveService), true);
  assert.equal(/^User=exedev$/m.test(fridayService), true);
  assert.equal(liveService.includes("Restart=on-failure"), true);
  assert.equal(fridayService.includes("Restart=on-failure"), true);
  assert.equal(
    /^ExecStart=\/usr\/bin\/node \/home\/exedev\/btc-insights\/job\/run\.mjs live$/m.test(liveService),
    true,
  );
  assert.equal(
    /^ExecStart=\/usr\/bin\/node \/home\/exedev\/btc-insights\/job\/run\.mjs friday$/m.test(fridayService),
    true,
  );
  assert.equal(liveTimer.includes("OnUnitActiveSec=10min"), true);
  assert.equal(liveTimer.includes("OnActiveSec=1min"), true);
  assert.equal(liveTimer.includes("Persistent=true"), false);
  assert.equal(fridayTimer.includes("OnCalendar=Sat *-*-* 00:05:00 UTC"), true);
  assert.equal(fridayTimer.includes("Persistent=true"), true);
  assert.equal(
    /^ExecStart=\/usr\/bin\/node \/home\/exedev\/btc-insights\/job\/visitors\.mjs$/m.test(visitorsService),
    true,
  );
  assert.equal(visitorsService.includes("EnvironmentFile="), false);
  assert.equal(visitorsTimer.includes("OnUnitActiveSec=1min"), true);
  assert.equal(visitorsTimer.includes("OnActiveSec=30s"), true);
});

test("deploy.md keeps the site command and points at the units", () => {
  const doc = read("../docs/deploy.md");
  assert.equal(doc.includes("rsync -a --delete --no-perms --no-group"), true);
  assert.equal(doc.includes("--exclude data/"), true);
  assert.equal(doc.includes("## Host units"), true);
  assert.equal(doc.includes("deploy/btc-insights-live.service"), true);
  assert.equal(doc.includes("deploy/btc-insights-live.timer"), true);
  assert.equal(doc.includes("deploy/btc-insights-friday.service"), true);
  assert.equal(doc.includes("deploy/btc-insights-friday.timer"), true);
  assert.equal(doc.includes("The job umask is 027."), true);
  assert.equal(doc.includes("Docker stays stopped."), true);
  assert.equal(doc.includes("deploy/btc-insights-visitors.service"), true);
  assert.equal(doc.includes("deploy/btc-insights-visitors.timer"), true);
  assert.equal(doc.includes("/etc/nginx/btc-insights-visitors.htpasswd"), true);
  assert.equal(doc.includes("location /visitors/"), true);
  assert.equal(doc.includes("location = /data/visitors.json"), true);
});

test("the visitors gate covers only the operator page and records the forwarded address", () => {
  assert.equal(visitorsNginx.includes('auth_basic "Visitors"'), true);
  assert.equal(visitorsNginx.includes("auth_basic_user_file /etc/nginx/btc-insights-visitors.htpasswd"), true);
  assert.equal(visitorsNginx.includes("location /visitors/"), true);
  assert.equal(visitorsNginx.includes("location = /data/visitors.json"), true);
  assert.equal(visitorsNginx.includes("friday.json"), false);
  assert.equal(visitorsNginx.includes("live.json"), false);
  assert.equal(logFormat.includes("$http_x_forwarded_for"), true);
  assert.equal(logFormat.includes("$host"), true);
  assert.equal(/\$apr1\$|[A-Za-z0-9+/]{16,}==/.test(visitorsNginx + logFormat), false);
});
