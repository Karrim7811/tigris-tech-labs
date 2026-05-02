#!/usr/bin/env bash
# ALEVANT deploy script.
# Run from Products/alevant-app/. Assumes BOOTSTRAP.md Step 0-3 are complete.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_DIR="$SCRIPT_DIR/web"

echo "→ ALEVANT deploy"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo

# --- Sanity checks ---
require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ Missing required tool: $1"
    echo "   See BOOTSTRAP.md Step 0."
    exit 1
  fi
}
require git
require node
require npm
require vercel
require supabase

# --- Pre-flight: env file present? ---
if [ ! -f "$WEB_DIR/.env.local" ] && [ -z "${VERCEL_ORG_ID:-}" ]; then
  echo "✗ web/.env.local missing AND VERCEL_ORG_ID not set."
  echo "   Either create web/.env.local from .env.example, or run inside a Vercel-linked dir."
  exit 1
fi

# --- 1. Install ---
echo "→ Installing dependencies"
cd "$WEB_DIR"
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile || pnpm install
else
  npm ci || npm install
fi

# --- 2. Type-check + lint ---
echo "→ Type-checking"
if command -v pnpm >/dev/null 2>&1; then
  pnpm typecheck
else
  npx tsc --noEmit
fi

# --- 3. Push DB migrations ---
echo "→ Pushing Supabase migrations"
supabase db push --linked

# --- 4. Build ---
echo "→ Building"
if command -v pnpm >/dev/null 2>&1; then
  pnpm build
else
  npm run build
fi

# --- 5. Deploy ---
TARGET="${1:-preview}"
if [ "$TARGET" = "prod" ] || [ "$TARGET" = "production" ]; then
  echo "→ Deploying to PRODUCTION"
  vercel deploy --prod --yes
else
  echo "→ Deploying preview (pass 'prod' to deploy production)"
  vercel deploy --yes
fi

echo
echo "✓ Deploy finished."
