#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

rsync -a --delete --no-perms --no-group \
  --exclude data/ \
  dist/ btcfriday.exe.xyz:/var/www/html/
ssh btcfriday.exe.xyz 'sudo chgrp -R www-data /var/www/html && sudo find /var/www/html -type d -exec chmod 2750 {} + && sudo find /var/www/html -type f -exec chmod 640 {} +'
ssh btcfriday.exe.xyz 'stat -c "%a %U:%G" /var/www/html | grep -qx "2750 exedev:www-data" && sudo -u www-data test -r /var/www/html/index.html && sudo -u www-data test ! -w /var/www/html && sudo -u www-data test ! -w /var/www/html/index.html && echo locked'
