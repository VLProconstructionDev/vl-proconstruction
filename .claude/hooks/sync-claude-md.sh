#!/usr/bin/env bash
# Stop hook: keep CLAUDE.md in sync with the repo.
#
# Fires when Claude Code finishes a turn. If any source file (*.html / *.mjs /
# *.js, excluding node_modules) is newer than CLAUDE.md, it counts the turn. Only
# once SYNC_EVERY change-turns have accumulated does it ask the main agent to
# launch the `claude-md-updater` subagent to re-sync the docs, then finish. This
# batches several edits into one updater run instead of paying for one per edit.
# On a chat-only turn (nothing newer than CLAUDE.md) it stays silent and cheap.
#
# Loop safety:
#  - Skips if this Stop was already triggered by a hook this turn (stop_hook_active).
#  - `touch`es CLAUDE.md when it blocks, so CLAUDE.md becomes the newest file and
#    the next turn won't re-trigger even if the updater decides no edit is needed.
#  - Resets the counter when it blocks, so counting restarts after each sync.

set -uo pipefail

ROOT="/Users/alexdatsyk/Downloads/vl-construction"
# Run the updater only once every N change-turns (batches edits to save tokens).
SYNC_EVERY=10
COUNTER_FILE="$ROOT/.claude/hooks/.sync-counter"
input=$(cat)

# Don't re-enter: if we already blocked once this turn, let the stop go through.
if printf '%s' "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "$ROOT" 2>/dev/null || exit 0
[ -f CLAUDE.md ] || exit 0

# Any tracked source file newer than CLAUDE.md?
changed=$(find . -type f \( -name '*.html' -o -name '*.mjs' -o -name '*.js' \) \
  -not -path './node_modules/*' -not -path './temporary screenshots/*' \
  -newer CLAUDE.md 2>/dev/null | head -1)

if [ -n "$changed" ]; then
  # Count this change-turn; only sync once SYNC_EVERY have piled up.
  count=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
  case "$count" in ''|*[!0-9]*) count=0 ;; esac
  count=$((count + 1))

  if [ "$count" -ge "$SYNC_EVERY" ]; then
    echo 0 > "$COUNTER_FILE"
    # Mark docs current up front so a no-op updater run can't loop across turns.
    touch CLAUDE.md
    printf '%s\n' '{"decision":"block","reason":"Source files changed since CLAUDE.md was last synced. Use the Agent tool to launch the claude-md-updater subagent to update CLAUDE.md against the current repo, then finish. Make no other changes and do not ask for confirmation."}'
  else
    # Not yet — accumulate and let the turn end silently.
    echo "$count" > "$COUNTER_FILE"
  fi
fi

exit 0
