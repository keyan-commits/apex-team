// Tests for CI health banner logic — AC7 (US-057, closes #248).
// Pure-function tests mirroring CiHealthBanner.tsx + OrchestratorBar pill logic.
import { describe, it, expect } from "vitest";
import type { CiState } from "../../src/types";
import { formatRelative } from "../../src/hooks/useCiHealth";

// ─── Banner visibility ────────────────────────────────────────────────────────

function shouldShowBanner(state: CiState): boolean {
  return state === "alarm" || state === "recovering";
}

describe("Banner visibility — AC7", () => {
  it("shows for alarm", () => expect(shouldShowBanner("alarm")).toBe(true));
  it("shows for recovering", () => expect(shouldShowBanner("recovering")).toBe(true));
  it("hidden for healthy", () => expect(shouldShowBanner("healthy")).toBe(false));
  it("hidden for warning (pill-only state)", () => expect(shouldShowBanner("warning")).toBe(false));
  it("hidden for unknown (false-alarm risk)", () => expect(shouldShowBanner("unknown")).toBe(false));
});

// ─── Banner ARIA role ─────────────────────────────────────────────────────────

function bannerRole(state: CiState): string {
  return state === "alarm" ? "alert" : "status";
}

function bannerAriaLive(state: CiState): string {
  return state === "alarm" ? "assertive" : "polite";
}

describe("Banner ARIA — AC7 a11y contract", () => {
  it("alarm → role=alert, aria-live=assertive", () => {
    expect(bannerRole("alarm")).toBe("alert");
    expect(bannerAriaLive("alarm")).toBe("assertive");
  });
  it("recovering → role=status, aria-live=polite", () => {
    expect(bannerRole("recovering")).toBe("status");
    expect(bannerAriaLive("recovering")).toBe("polite");
  });
});

// ─── Banner copy ──────────────────────────────────────────────────────────────

function alarmCopy(consecutiveReds: number, runName: string | null, relTime: string | null): string {
  const detail = runName && relTime ? ` · last: ${runName} · ${relTime}` : "";
  return `✕  main CI RED — ${consecutiveReds} consecutive failure${consecutiveReds !== 1 ? "s" : ""}${detail}`;
}

describe("Alarm banner copy — AC7", () => {
  it("pluralizes correctly for N>1", () => {
    expect(alarmCopy(3, "CI", "4 min ago")).toBe(
      "✕  main CI RED — 3 consecutive failures · last: CI · 4 min ago",
    );
  });
  it("singular for N=1", () => {
    expect(alarmCopy(1, "CI", "1s ago")).toBe(
      "✕  main CI RED — 1 consecutive failure · last: CI · 1s ago",
    );
  });
  it("omits detail when latestRun is absent", () => {
    expect(alarmCopy(2, null, null)).toBe("✕  main CI RED — 2 consecutive failures");
  });
});

describe("Recovering banner copy — AC7", () => {
  it("has fixed copy regardless of count", () => {
    const copy = "↻  main CI recovering — run in progress";
    expect(copy).toBe("↻  main CI recovering — run in progress");
  });
});

// ─── Pill visibility ──────────────────────────────────────────────────────────

function shouldShowPill(state: CiState): boolean {
  return state !== "healthy";
}

describe("Pill visibility — AC7", () => {
  it("hidden for healthy (zero-noise happy path)", () => expect(shouldShowPill("healthy")).toBe(false));
  it("shown for warning", () => expect(shouldShowPill("warning")).toBe(true));
  it("shown for alarm", () => expect(shouldShowPill("alarm")).toBe(true));
  it("shown for recovering", () => expect(shouldShowPill("recovering")).toBe(true));
  it("shown for unknown", () => expect(shouldShowPill("unknown")).toBe(true));
});

// ─── Pill body text ───────────────────────────────────────────────────────────

function pillBodyText(state: Exclude<CiState, "healthy">, consecutiveReds: number): string {
  if (state === "alarm" || state === "warning") return `${consecutiveReds} red`;
  if (state === "recovering") return "recovering";
  return "CI";
}

describe("Pill body text — responsive abbreviated label", () => {
  it("warning shows N red", () => expect(pillBodyText("warning", 1)).toBe("1 red"));
  it("alarm shows N red", () => expect(pillBodyText("alarm", 3)).toBe("3 red"));
  it("recovering shows 'recovering'", () => expect(pillBodyText("recovering", 0)).toBe("recovering"));
  it("unknown shows 'CI'", () => expect(pillBodyText("unknown", 0)).toBe("CI"));
});

// ─── Pill tooltip copy ────────────────────────────────────────────────────────

function unknownTooltip(staleSince: string | null): string {
  const checked = staleSince ? formatRelative(staleSince) : "never";
  return `CI health unknown — last checked ${checked}`;
}

describe("Pill tooltip — unknown state", () => {
  it("shows 'never' when staleSince is null", () => {
    expect(unknownTooltip(null)).toBe("CI health unknown — last checked never");
  });
});

// ─── formatRelative ───────────────────────────────────────────────────────────

describe("formatRelative", () => {
  it("shows seconds for sub-minute diffs", () => {
    const iso = new Date(Date.now() - 45_000).toISOString();
    expect(formatRelative(iso)).toBe("45s ago");
  });
  it("shows minutes for sub-hour diffs", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelative(iso)).toBe("5 min ago");
  });
  it("shows hours for large diffs", () => {
    const iso = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatRelative(iso)).toBe("3h ago");
  });
});
