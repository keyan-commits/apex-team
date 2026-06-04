#!/bin/sh
# ticket: OPS-0002
# parent_feat: FEAT-0003
# parent_us: US-100
# role: devsecops
# status: in-flight
#
# Usage: sh ops/pipelines/staging.sh [FEAT-XXXX]
# Staging environment pipeline — lint + type-check + test + build + smoke.
# Base steps run unconditionally; per-feature overlay sourced if present.

set -e

FEAT="${1:-}"

ENV_NAME="staging"
echo "[pipeline] env=${ENV_NAME} feat=${FEAT:-none}"

# --- Base steps (staging: lint + type-check + test + build + deploy-preview) ---
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

echo "[pipeline] step: build"
# step_build() { pnpm build; }
# step_build

echo "[pipeline] step: deploy-preview"
# step_deploy_preview() { echo "Deploy to staging preview environment here"; }
# step_deploy_preview

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
