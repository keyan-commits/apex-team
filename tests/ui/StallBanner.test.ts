// Tests for stall notification logic — AC1–AC4 (US-036, closes #178).
// Pure-function tests mirroring dashboard/page.tsx stall logic.
// Pattern mirrors AgentPane.test.ts: copy logic here, edit both together.
import { describe, it, expect } from "vitest";

// Constants mirrored from StallSettingsDrawer.tsx
const DEFAULT_STALL_SETTINGS = { banner: true, notification: false, audio: false };
const STALL_SETTINGS_KEY = "apex-team:stall-settings";

// ─── AC1: Banner visibility predicate ─────────────────────────────────────────

function bannerVisible(stallActive: boolean, dismissed: boolean, bannerEnabled: boolean): boolean {
  return stallActive && !dismissed && bannerEnabled;
}

describe("AC1 — Banner visibility", () => {
  it("shows when stall active, not dismissed, banner enabled", () => {
    expect(bannerVisible(true, false, true)).toBe(true);
  });

  it("hidden when stall not active", () => {
    expect(bannerVisible(false, false, true)).toBe(false);
  });

  it("hidden when dismissed", () => {
    expect(bannerVisible(true, true, true)).toBe(false);
  });

  it("hidden when banner setting disabled", () => {
    expect(bannerVisible(true, false, false)).toBe(false);
  });

  it("auto-disappears when stall clears", () => {
    expect(bannerVisible(false, false, true)).toBe(false);
    expect(bannerVisible(false, true, true)).toBe(false);
  });
});

// ─── AC2: Stall onset detection ───────────────────────────────────────────────

function detectOnset(prevStallActive: boolean, currentStallActive: boolean): boolean {
  return !prevStallActive && currentStallActive;
}

describe("AC2 — Stall onset detection", () => {
  it("detects onset on false → true transition", () => {
    expect(detectOnset(false, true)).toBe(true);
  });

  it("does NOT fire on continued stall (true → true)", () => {
    expect(detectOnset(true, true)).toBe(false);
  });

  it("does NOT fire on stall clearing (true → false)", () => {
    expect(detectOnset(true, false)).toBe(false);
  });

  it("does NOT fire on healthy → healthy (false → false)", () => {
    expect(detectOnset(false, false)).toBe(false);
  });
});

// ─── AC3: Notification permission state machine ───────────────────────────────

type PermState = NotificationPermission | "unavailable";

function notificationToggleAction(
  checked: boolean,
  permission: PermState,
): "disable" | "enable" | "request" | "noop" {
  if (!checked) return "disable";
  if (permission === "denied" || permission === "unavailable") return "noop";
  if (permission === "granted") return "enable";
  return "request";
}

describe("AC3 — Notification permission flow", () => {
  it("disabling always returns disable regardless of permission", () => {
    expect(notificationToggleAction(false, "granted")).toBe("disable");
    expect(notificationToggleAction(false, "denied")).toBe("disable");
    expect(notificationToggleAction(false, "default")).toBe("disable");
  });

  it("enabling with granted → enable immediately", () => {
    expect(notificationToggleAction(true, "granted")).toBe("enable");
  });

  it("enabling with default → request permission", () => {
    expect(notificationToggleAction(true, "default")).toBe("request");
  });

  it("enabling with denied → noop (cannot request again)", () => {
    expect(notificationToggleAction(true, "denied")).toBe("noop");
  });

  it("enabling when Notification API unavailable → noop", () => {
    expect(notificationToggleAction(true, "unavailable")).toBe("noop");
  });
});

// ─── AC3: Notification toggle disabled state ──────────────────────────────────

function notifToggleDisabled(permission: PermState): boolean {
  return permission === "denied" || permission === "unavailable";
}

describe("AC3 — Notification toggle disabled state", () => {
  it("disabled when permission denied", () => {
    expect(notifToggleDisabled("denied")).toBe(true);
  });

  it("disabled when Notification API unavailable", () => {
    expect(notifToggleDisabled("unavailable")).toBe(true);
  });

  it("enabled when permission default", () => {
    expect(notifToggleDisabled("default")).toBe(false);
  });

  it("enabled when permission granted", () => {
    expect(notifToggleDisabled("granted")).toBe(false);
  });
});

// ─── AC4: Settings defaults and localStorage persistence ─────────────────────

function loadSettings(raw: string | null): typeof DEFAULT_STALL_SETTINGS {
  if (!raw) return DEFAULT_STALL_SETTINGS;
  try {
    return { ...DEFAULT_STALL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STALL_SETTINGS;
  }
}

describe("AC4 — Settings defaults", () => {
  it("default banner is ON", () => {
    expect(DEFAULT_STALL_SETTINGS.banner).toBe(true);
  });

  it("default notification is OFF", () => {
    expect(DEFAULT_STALL_SETTINGS.notification).toBe(false);
  });

  it("default audio is OFF", () => {
    expect(DEFAULT_STALL_SETTINGS.audio).toBe(false);
  });

  it("storage key matches spec", () => {
    expect(STALL_SETTINGS_KEY).toBe("apex-team:stall-settings");
  });
});

describe("AC4 — Settings localStorage persistence", () => {
  it("returns defaults when key absent", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_STALL_SETTINGS);
  });

  it("returns defaults on malformed JSON", () => {
    expect(loadSettings("{bad}")).toEqual(DEFAULT_STALL_SETTINGS);
  });

  it("overrides defaults with stored values", () => {
    const stored = JSON.stringify({ banner: false, notification: true, audio: true });
    expect(loadSettings(stored)).toEqual({ banner: false, notification: true, audio: true });
  });

  it("partial stored value merges with defaults", () => {
    const stored = JSON.stringify({ audio: true });
    const result = loadSettings(stored);
    expect(result.audio).toBe(true);
    expect(result.banner).toBe(true);
    expect(result.notification).toBe(false);
  });

  it("round-trips through JSON", () => {
    const settings = { banner: false, notification: true, audio: false };
    const restored = JSON.parse(JSON.stringify(settings));
    expect(restored).toEqual(settings);
  });
});
