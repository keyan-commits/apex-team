#!/bin/sh
# Template: ops/pipelines/_template.sh
# ─────────────────────────────────────────────────────────────────────────────
# DO NOT run this file directly. It is a copy-paste skeleton only.
# Copy it to ops/pipelines/<env>.sh and customize.
# This file is intentionally NOT chmod +x.
#
# Usage after copying:
#   sh ops/pipelines/<env>.sh [FEAT-XXXX]
#
# Slots to fill in:
#   1. Add/replace the header comment block with the correct ticket frontmatter.
#   2. Name the ENV_NAME variable after the environment this pipeline represents.
#   3. Implement the step functions in the "Base steps" section.
#   4. The overlay block at the bottom is fixed — do not remove it.
#
# ─────────────────────────────────────────────────────────────────────────────
# Frontmatter (replace with real values):
# ticket: OPS-NNNN
# parent_feat: FEAT-XXXX
# parent_us: US-NNN
# role: devsecops
# status: proposed
# ─────────────────────────────────────────────────────────────────────────────

set -e

FEAT="${1:-}"

# Replace with the environment name this file represents (dev / staging / prod / etc.)
ENV_NAME="<env>"
echo "[pipeline] env=${ENV_NAME} feat=${FEAT:-none}"

# --- Base steps (customize per environment) ---
# Uncomment and implement the step functions that apply to your environment tier.
# Fail fast: cheapest steps (lint, type-check) before expensive ones (build, deploy).
#
# step_lint() {
#   pnpm lint --max-warnings 0
# }
#
# step_type_check() {
#   pnpm type-check
# }
#
# step_test() {
#   pnpm test:run
# }
#
# step_build() {
#   pnpm build
# }
#
# step_deploy() {
#   # Add your deploy command here. For prod, gate behind an approval step first.
#   echo "Deploy to ${ENV_NAME}"
# }
#
# Call each step in order; set -e ensures the pipeline exits on first failure:
# step_lint
# step_type_check
# step_test
# step_build
# step_deploy

echo "[pipeline] base steps: (none scaffolded — add per project)"

# --- Feature overlay (do not remove this block) ---
# The overlay is sourced AFTER base steps so it can extend or override them.
# Overlays live at ops/features/FEAT-XXXX-<slug>/OPS-NNNN-<slug>.sh.
# If no overlay is present the pipeline proceeds with base steps only — no error.
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
