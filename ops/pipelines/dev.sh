#!/bin/sh
# ticket: OPS-0001
# parent_feat: FEAT-0003
# parent_us: US-100
# role: devsecops
# status: in-flight
#
# Usage: sh ops/pipelines/dev.sh [FEAT-XXXX]
# Dev environment pipeline — lint + type-check + test.
# Base steps run unconditionally; per-feature overlay sourced if present.

set -e

FEAT="${1:-}"

ENV_NAME="dev"
echo "[pipeline] env=${ENV_NAME} feat=${FEAT:-none}"

# --- Base steps (dev: lint + type-check + test) ---
# Customize for your project stack. Scaffolding ships with echo stubs.
echo "[pipeline] step: lint"
# step_lint() { pnpm lint --max-warnings 0; }
# step_lint

echo "[pipeline] step: type-check"
# step_type_check() { pnpm type-check; }
# step_type_check

echo "[pipeline] step: test"
# step_test() { pnpm test:run; }
# step_test

echo "[pipeline] base steps: (none scaffolded — add per project)"

# --- Feature overlay (do not remove this block) ---
if [ -n "$FEAT" ]; then
  OVERLAY_DIR="ops/features/${FEAT}"
  if [ -d "$OVERLAY_DIR" ]; then
    for overlay in "$OVERLAY_DIR"/*.sh; do
      [ -f "$overlay" ] || continue
      echo "[pipeline] sourcing overlay: $overlay"
      . "$overlay"
    done
  else
    echo "[pipeline] no overlay dir at ${OVERLAY_DIR} — base only"
  fi
fi

echo "[pipeline] env=${ENV_NAME} feat=${FEAT:-none} OK"
