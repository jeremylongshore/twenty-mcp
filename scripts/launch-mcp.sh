#!/usr/bin/env bash
# Twenty MCP launcher.
# Resolves TWENTY_API_KEY via this lookup chain (first hit wins):
#   1. $TWENTY_API_KEY environment variable (caller can override)
#   2. ~/.config/twenty/api-key   ← plaintext file (mode 600). Survives non-TTY contexts.
#   3. `pass show twenty/api-key` ← gpg-encrypted at rest. Needs gpg-agent unlocked.
# Used by Claude Code mcpServers entry "twenty".

set -euo pipefail
umask 077

REPO_DIR="/home/jeremy/000-projects/twenty-mcp"
KEYFILE="${HOME}/.config/twenty/api-key"

if [ ! -d "$REPO_DIR" ]; then
  echo "Twenty MCP repository not found: $REPO_DIR" >&2
  exit 1
fi

if [ -z "${TWENTY_API_KEY:-}" ]; then
  if [ -r "$KEYFILE" ]; then
    IFS= read -r TWENTY_API_KEY < "$KEYFILE"
  else
    # Fall back to pass — requires gpg-agent unlock (`pass show twenty/api-key >/dev/null` in TTY)
    TWENTY_API_KEY="$(pass show twenty/api-key)"
  fi
fi
export TWENTY_API_KEY
export TWENTY_BASE_URL="${TWENTY_BASE_URL:-${TWENTY_API_BASE_URL:-https://crm.intentsolutions.io}}"

cd "$REPO_DIR"

# Prefer built dist/index.js (stdio entrypoint); fall back to tsx runtime if dist missing.
if [ -f "$REPO_DIR/dist/index.js" ]; then
  exec node "$REPO_DIR/dist/index.js" "$@"
else
  exec "$REPO_DIR/node_modules/.bin/tsx" "$REPO_DIR/src/index.ts" "$@"
fi
