#!/bin/sh
# ticket: OPS-0003
# parent_feat: FEAT-0003
# parent_us: US-100
# role: devsecops
# status: in-flight
#
# Usage: sh ops/pipelines/prod.sh [FEAT-XXXX]
# Production environment pipeline — lint + type-check + test + build + sign + deploy-dry-run.
# Base steps run unconditionally; per-feature overlay sourced if present.
# PRODUCTION NOTE: Add approval gate / manual sign-off before any live deploy step.

set -e

FEAT="${1:-}"

ENV_NAME="prod"
echo "[pipeline] env=${ENV_NAME} feat=${FEAT:-none}"

# --- Base steps (prod: all stages + approval gate comment) ---
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

echo "[pipeline] step: sign-artifacts"
# step_sign() { echo "Sign artifacts with Sigstore / cosign here"; }
# step_sign

echo "[pipeline] step: deploy-dry-run"
# step_deploy_dry_run() { echo "Run deploy in --dry-run mode for approval"; }
# step_deploy_dry_run

# Approval gate: in a live pipeline, pause here and require a manual sign-off
# (e.g. a GitHub environment protection rule with required reviewers) before
# the real deploy step fires. Scaffolding does not implement this — add it
# when your deployment target is known.
echo "[pipeline] step: approval-gate (scaffolded — implement for your deploy target)"

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
