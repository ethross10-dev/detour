#!/usr/bin/env bash
# Deploy Detour to GitHub Pages.
#   ./publish.sh "what changed"
# Bumps the service-worker cache version first — without that, installed
# copies keep serving the old files.
set -euo pipefail
MSG="${1:-update}"
cd "$(dirname "$0")"

CUR=$(grep -oE 'detour-v[0-9]+[a-z-]*' sw.js | head -1)
N=$(echo "$CUR" | grep -oE '[0-9]+' | head -1)
NEW="detour-v$((N+1))"
sed -i.bak "s/$CUR/$NEW/" sw.js && rm -f sw.js.bak
echo "service worker cache: $CUR -> $NEW"

git add -A
git commit -m "$MSG"
git push origin main
echo "pushed. live in ~1 min at https://ethross10-dev.github.io/detour/"
