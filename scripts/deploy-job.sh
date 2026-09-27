#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

rsync -a --exclude .env \
  job/run.mjs btcfriday.exe.xyz:/home/exedev/btc-insights/job/
