#!/usr/bin/env bash
# aphelion-sensitive-file-guard.sh
# Aphelion hook B: PreToolUse on Write|Edit — #107
#
# Reads Claude Code hook stdin payload (JSON), extracts the target file_path,
# then applies allow-list / block-list logic to prevent writing secret files.
#
# Judgment order (first match wins):
#   1. ALLOW_PATH_PATTERNS  → exit 0 (allow)
#   2. ALLOW_SUFFIXES       → exit 0 (allow: .env.example / .env.template etc.)
#   3. BLOCK_GLOBS          → exit 2 (block: .env / *.pem / *.key etc.)
#   4. otherwise            → exit 0 (allow)
#
# Returns:
#   exit 0 — path is safe; write proceeds
#   exit 2 — sensitive filename detected; write is blocked (PreToolUse block)
#   exit 1 — script error (trapped → exit 0 fail-open so user work is not stopped)
#
# No bypass token is provided intentionally (analyst §5.5):
# to proceed, edit .claude/settings.json and remove this hook entry, or rename
# the target file to a safe suffix (.example, .template, .sample, .dist).
#
# Canonical path: src/.claude/hooks/aphelion-sensitive-file-guard.sh
# Deployed to:    .claude/hooks/aphelion-sensitive-file-guard.sh

set -euo pipefail

HOOK_NAME="sensitive-file-guard"

# Fail-open: any uncaught error exits with 0 so hook bugs never block user work.
# shellcheck disable=SC2064
trap 'echo "[aphelion-hook:'"${HOOK_NAME}"'] internal error at line $LINENO; passing through" >&2; exit 0' ERR

# Read stdin (Claude Code hook payload JSON)
RAW_PAYLOAD="$(cat)"

# Extract tool_input.file_path field
# Handles both Write and Edit tool payloads (both use "file_path").
TARGET_PATH=$(printf '%s' "$RAW_PAYLOAD" \
  | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' \
  | head -1 \
  | sed -E 's/^"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')

# If file_path not found in payload, pass through (unexpected payload format)
if [ -z "$TARGET_PATH" ]; then
  exit 0
fi

BASENAME=$(basename -- "$TARGET_PATH")

# --- Step 1: ALLOW_PATH_PATTERNS (path substring match; these are always safe) ---
ALLOW_PATH_PATTERNS=(
  '(^|/)tests?/'
  '(^|/)__fixtures__/'
  '(^|/)__snapshots__/'
  '(^|/)fixtures/'
  '(^|/)examples/'
  '(^|/)docs/'
)
for p in "${ALLOW_PATH_PATTERNS[@]}"; do
  if printf '%s' "$TARGET_PATH" | grep -qE "$p"; then
    exit 0
  fi
done

# --- Step 2: ALLOW_SUFFIXES (basename suffix match, case-insensitive) ---
# Covers .env.example / .env.template / .env.sample / .env.dist etc.
ALLOW_SUFFIXES=( '.example' '.template' '.sample' '.dist' )
for s in "${ALLOW_SUFFIXES[@]}"; do
  # Use lowercase comparison (bash 4+ syntax; WSL2 / macOS 12+ guaranteed)
  case "${BASENAME,,}" in
    *"${s,,}") exit 0 ;;
  esac
done

# --- Step 3: BLOCK_GLOBS (basename shell glob match) ---
BLOCK_GLOBS=(
  '.env'
  '.env.*'
  '*.pem'
  '*.key'
  'credentials.*'
  '*.secret'
  'id_rsa'
  'id_ed25519'
  'id_ecdsa'
)
for g in "${BLOCK_GLOBS[@]}"; do
  # shellcheck disable=SC2254
  case "$BASENAME" in
    $g)
      cat >&2 <<EOF
[aphelion-hook:${HOOK_NAME}] BLOCKED: write to sensitive file
  path: ${TARGET_PATH}
  matched glob: ${g}
  rationale: this filename is conventionally used for secrets (private keys,
    credentials, populated env files). Aphelion blocks creation/edit by default.
  bypass: there is no commit-message-style bypass for this hook.
    To proceed, edit .claude/settings.json and remove the
    aphelion-sensitive-file-guard PreToolUse entry, or rename the target file
    to one of: *.example, *.template, *.sample, *.dist.
EOF
      exit 2
      ;;
  esac
done

# --- Step 4: everything else is safe ---
exit 0
