#!/bin/bash
# Patch @liveblocks/react-ui Composer to allow attachment-only submissions.
# Liveblocks prevents form submit when text editor is empty, even with attachments.
# This patches both canSubmit and handleSubmit to check attachments.length.

LB_DIR=$(find node_modules/.pnpm -path "*/@liveblocks/react-ui/dist/primitives/Composer/index.cjs" -print -quit 2>/dev/null)
if [ -z "$LB_DIR" ]; then
  echo "[patch-liveblocks] Could not find Composer primitives, skipping."
  exit 0
fi

DIR=$(dirname "$LB_DIR")

for EXT in cjs js; do
  FILE="$DIR/index.$EXT"
  if [ -f "$FILE" ]; then
    # Patch canSubmit: allow submit when attachments exist even if text is empty
    sed -i.bak "s/return !isEmpty\\\$1 && !isUploadingAttachments;/return (!isEmpty\$1 || attachments.length > 0) \&\& !isUploadingAttachments;/" "$FILE" 2>/dev/null

    # Patch handleSubmit: only block if empty AND no attachments
    sed -i.bak2 "s/if (isEmpty2) {/if (isEmpty2 \&\& attachments.length === 0) {/" "$FILE" 2>/dev/null

    rm -f "$FILE.bak" "$FILE.bak2" "$FILE.bak3"
    echo "[patch-liveblocks] Patched $FILE"
  fi
done
