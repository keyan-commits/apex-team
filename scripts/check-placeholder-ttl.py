#!/usr/bin/env python3
"""check-placeholder-ttl.py — ADR-018 placeholder backfill TTL checker.

Reads the list of recently merged PRs from stdin (JSON array as produced by
`gh pr list --json number,mergedAt,mergeCommit`) and the current epoch
from the GRACE_SECONDS / NOW_EPOCH env vars (or defaults), then checks
whether any Wave-111+ PR #0 placeholder SHAs in the coordination/handoffs/
directory correspond to a PR that was merged more than GRACE_SECONDS ago.

Exits 1 if any overdue placeholders are found (soft-fail: callers may
treat this as a warning rather than a hard failure per ADR-018).
Exits 0 if all placeholders are within the grace window or no placeholders
are found.

Usage (from CI, reading gh JSON from stdin):
    gh pr list \\
      --repo "$GITHUB_REPOSITORY" \\
      --state merged \\
      --limit 20 \\
      --json number,mergedAt,mergeCommit \\
    | python3 scripts/check-placeholder-ttl.py

Environment variables (all optional — defaults are sensible for CI):
    HANDOFFS_DIR     Path to coordination/handoffs/. Default: coordination/handoffs
    GRACE_SECONDS    How long a PR #0 placeholder is OK after merge. Default: 3600 (1h)
    NOW_EPOCH        Unix epoch to use as "now". Default: current time.
    GIT_BINARY       Path to git binary. Default: git
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HANDOFFS_DIR = Path(os.environ.get("HANDOFFS_DIR", "coordination/handoffs"))
GRACE_SECONDS = int(os.environ.get("GRACE_SECONDS", "3600"))
NOW_EPOCH = int(os.environ.get("NOW_EPOCH", str(int(time.time()))))
GIT = os.environ.get("GIT_BINARY", "git")

# ADR-018 canonical regex components (pure Python, no re dependency for the pattern itself)
WAVE_PLACEHOLDER_PREFIX = "### Wave-"
PLACEHOLDER_PR = "PR #0"


def is_ancestor(candidate_sha: str, merge_sha: str) -> bool:
    """Return True if candidate_sha is an ancestor of merge_sha."""
    result = subprocess.run(
        [GIT, "merge-base", "--is-ancestor", candidate_sha, merge_sha],
        capture_output=True,
    )
    return result.returncode == 0


def parse_wave_number(line: str) -> int | None:
    """Extract the wave number from a verdict heading line, or None."""
    # Format: ### Wave-NNN ...
    try:
        after_wave = line.split("Wave-", 1)[1]
        wave_str = ""
        for ch in after_wave:
            if ch.isdigit():
                wave_str += ch
            else:
                break
        return int(wave_str) if wave_str else None
    except (IndexError, ValueError):
        return None


def extract_sha(line: str) -> str | None:
    """Extract the 40-char hex SHA from a verdict heading line, or None."""
    if " SHA " not in line:
        return None
    after_sha = line.split(" SHA ", 1)[1].strip()
    sha = after_sha[:40]
    if len(sha) == 40 and all(c in "0123456789abcdef" for c in sha):
        return sha
    return None


def find_placeholder_shas() -> list[tuple[Path, int, int, str]]:
    """Return list of (file, lineno, wave_num, placeholder_sha) for Wave-111+
    PR #0 placeholders found in HANDOFFS_DIR."""
    results = []
    if not HANDOFFS_DIR.is_dir():
        print(f"WARNING: HANDOFFS_DIR {HANDOFFS_DIR} does not exist.", file=sys.stderr)
        return results
    for f in sorted(HANDOFFS_DIR.glob("*.md")):
        for lineno, line in enumerate(f.read_text().splitlines(), start=1):
            line = line.rstrip()
            # Quick filter: must start with ### Wave- and contain PR #0 and PASS
            if not (
                line.startswith(WAVE_PLACEHOLDER_PREFIX)
                and PLACEHOLDER_PR in line
                and "PASS verdict" in line
            ):
                continue
            wave_num = parse_wave_number(line)
            if wave_num is None or wave_num < 111:
                continue
            sha = extract_sha(line)
            if sha is None:
                continue
            results.append((f, lineno, wave_num, sha))
    return results


def main() -> int:
    merged_prs_json = sys.stdin.read().strip()
    try:
        prs = json.loads(merged_prs_json)
    except json.JSONDecodeError as e:
        print(f"ERROR: Could not parse merged PRs JSON from stdin: {e}", file=sys.stderr)
        return 1

    placeholders = find_placeholder_shas()
    if not placeholders:
        print("OK: No Wave-111+ PR #0 placeholder verdicts found.")
        return 0

    warn = False
    for f, lineno, wave_num, placeholder_sha in placeholders:
        print(
            f"Found Wave-{wave_num} PR #0 placeholder at {f}:{lineno} (SHA: {placeholder_sha})"
        )
        # Check if this SHA corresponds to a recently merged PR
        for pr in prs:
            mc = pr.get("mergeCommit") or {}
            merge_sha = mc.get("oid", "")
            merged_at = pr.get("mergedAt", "")
            pr_number = pr.get("number", "?")
            if not merge_sha or not merged_at:
                continue
            if not is_ancestor(placeholder_sha, merge_sha):
                continue
            # It's an ancestor — check the merge age
            try:
                merged_dt = datetime.fromisoformat(merged_at.replace("Z", "+00:00"))
            except ValueError:
                continue
            merged_epoch = int(merged_dt.timestamp())
            age = NOW_EPOCH - merged_epoch
            if age > GRACE_SECONDS:
                h = age // 3600
                m = (age % 3600) // 60
                print(
                    f"  PR #{pr_number} merged {h}h{m}m ago — backfill overdue "
                    f"(grace: {GRACE_SECONDS // 3600}h)"
                )
                warn = True

    if warn:
        print("")
        print("WARNING: One or more PR #0 verdict placeholders are overdue for backfill.")
        print("DevSecOps should run the post-merge backfill commit:")
        print("  git commit -m 'chore(handoff): backfill Wave-NNN verdict PR # and merge SHA'")
        print("See ADR-018 Wave 111b: architecture/decisions/ADR-018-pass-verdict-format.md")
        return 1

    print("OK: No overdue PR #0 placeholders found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
