# Deploy

The live site is the exe.dev VM `btcfriday.exe.xyz`. nginx serves `/var/www/html` on port 8000, and exe.dev terminates HTTPS in front of that port. Follow this file on every deploy. The stack is `docs/12-tech-stack-approach.md`.

## Who connects

`ssh btcfriday.exe.xyz` lands as `exedev`, not root. `exedev` can sudo. The deploy and the scheduled job both run as `exedev`.

Do not deploy as root. Do not run the job as root or as `www-data`.

## Host packages

The job runs on Node.js 24 LTS, installed from the NodeSource `node_24.x` apt repository at `https://deb.nodesource.com/node_24.x`. On 26 September 2026 that is `v24.21.0` at `/usr/bin/node`, with npm `11.19.0`. The package is pinned at priority 600, so apt prefers it over Ubuntu's Node 18 package. The job uses Node's built-in `fetch` and installs no npm packages on the host. N|solid is not installed.

`sudo apt update && sudo apt upgrade` moves Node along the 24 line. It does not jump to a later major. Node 24 receives security fixes through 30 April 2028. A later major is a separate change of that repository. Unattended upgrades on this VM cover Ubuntu only, so a Node release waits until that apt command is run. After Node itself is upgraded, restart the scheduled job so it is not still running the previous binary.

nginx, rsync, curl, ca-certificates, OpenSSL, systemd, and git were already on the image. Python 3.12 is on the image and is not used by the site. Do not add a compiler toolchain, and do not start Docker.

nginx's master process runs as root. The workers that read the files and answer requests run as `www-data`. These rules assume an attacker who can act as a worker.

## Layout

| Path | Who writes it | Mode |
|---|---|---|
| `/var/www/html` | The deploy, as `exedev` | `2750`, `exedev:www-data` |
| `/var/www/html/data` | The scheduled job only | `2750`, `exedev:www-data` |
| `/home/exedev/btc-insights` | The job and its secrets | `700`, `exedev:exedev` |

`/home/exedev` is mode `750`, so `www-data` cannot enter it. Secrets go in `/home/exedev/btc-insights/.env`, mode `600`, owner `exedev`. A key, a `.env`, or a private working file never goes under `/var/www`.

## Permissions

The web root is owner `exedev`, group `www-data`.

Directories are mode `2750`. The setgid bit makes a new file inherit group `www-data`, which is what lets nginx read it. `exedev` is not a member of `www-data` and cannot set that bit. Only sudo can. A `chmod` run as `exedev` silently turns `2750` into `750` and drops the bit. Do not chmod the web root as `exedev`.

Files are mode `640`. The group can read. The group cannot write, and other accounts cannot read. `www-data` cannot create, rewrite, or delete a file, because the directory is not writable by the group.

Do not `chown` the tree to `www-data`. Do not use mode `664`, `666`, `775`, or `777`. A group-writable file is a file the worker can replace.

## Deploy command

From this repo, once the shell is built into `dist/`:

```bash
rsync -a --delete --no-perms --no-group \
  --exclude data/ \
  dist/ btcfriday.exe.xyz:/var/www/html/
ssh btcfriday.exe.xyz 'sudo chgrp -R www-data /var/www/html && sudo find /var/www/html -type d -exec chmod 2750 {} + && sudo find /var/www/html -type f -exec chmod 640 {} +'
```

`--no-perms` and `--no-group` stop rsync from clearing the setgid bit. The sudo line puts the group and the modes back on every file, including files the job wrote. `--exclude data/` keeps `--delete` from removing the job's JSON. `--delete-excluded` is not used.

A file deploy does not reload nginx. Reload nginx only after a change under `/etc/nginx`.

## The job

The scheduled job runs as `exedev` with `umask 027`. It writes `/var/www/html/data/friday.json` and `/var/www/html/data/live.json`. That directory already exists and is setgid. The job does not create directories. A new directory is made with sudo and then `chmod 2750`. Otherwise the setgid bit is missing and nginx cannot read what the job puts there.

`umask 027` makes the new files mode `640`. The login umask on this box is `022`, which leaves a file world-readable. That file is still not writable by `www-data`. The job does not rely on the next deploy to tighten it.

## Check after every deploy

```bash
ssh btcfriday.exe.xyz 'stat -c "%a %U:%G" /var/www/html | grep -qx "2750 exedev:www-data" && sudo -u www-data test -r /var/www/html/index.html && sudo -u www-data test ! -w /var/www/html && sudo -u www-data test ! -w /var/www/html/index.html && echo locked'
```

`locked` means the worker can read the site and cannot write it. Anything else stops the deploy.

## nginx rules that back this up

The site file is `/etc/nginx/sites-available/default`. The extra file is `/etc/nginx/conf.d/btc-insights.conf`.

- `autoindex off`, so a directory cannot be listed.
- A request for a hidden file, including `/.env`, is denied.
- `server_tokens off`.
- CSS, JavaScript, JSON, and SVG responses are compressed.
- `/data/friday.json` is cached for a day (`max-age=86400`). `/data/live.json` is cached for a minute (`max-age=60`). The live slice carries the Friday date, and the page refetches `friday.json` when that date changes.
- `/visitors/` and `/data/visitors.json` ask for a password. The realm is `Visitors`. The file is `/etc/nginx/btc-insights-visitors.htpasswd`, mode `640`, owner `root`, group `www-data`. The plaintext stays off the VM and out of git. To replace it, write a new apr1 hash with `openssl passwd -apr1` and reload nginx. The locations are `location /visitors/` and `location = /data/visitors.json`.
- The visitors snippet is `deploy/nginx/visitors.conf`, copied to `/etc/nginx/btc-insights-visitors.conf` and included from the server block. The log format is `deploy/nginx/log-format.conf`, copied to `/etc/nginx/conf.d/btc-insights-log.conf`. New lines append the forwarded client chain and the public host. The server `access_log` uses that format, so each request is still written once.

## Leave Docker stopped

`exedev` is in the `docker` group, and the Docker socket is writable by that group. Membership of that group is root-equivalent while Docker is running. Docker is installed and inactive. Do not start it to host this site.

## Host units

`scripts/deploy-job.sh` copies `job/run.mjs` to `/home/exedev/btc-insights/job/` and excludes `.env`. It does not use `--delete`.

The six units are `deploy/btc-insights-live.service`, `deploy/btc-insights-live.timer`, `deploy/btc-insights-friday.service`, `deploy/btc-insights-friday.timer`, `deploy/btc-insights-visitors.service`, and `deploy/btc-insights-visitors.timer`. The services run as `exedev` with `Restart=on-failure`. The live timer is `OnActiveSec=1min` and then `OnUnitActiveSec=10min`. The Friday timer is `OnCalendar=Sat *-*-* 00:05:00 UTC`. The visitors timer is `OnActiveSec=30s` and then `OnUnitActiveSec=1min`. It reads the nginx access log and writes `/var/www/html/data/visitors.json`. It does not load `.env`. These files have no `WantedBy`. On the VM, each timer is enabled by `/etc/systemd/system/<timer>.d/enable.conf` with `WantedBy=timers.target`.

The job umask is 027. Docker stays stopped.
