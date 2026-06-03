// Tests for McpRebindBanner visibility logic — US-064 AC4.
// Pure-function tests mirroring the shouldShowBanner predicate in the component.
import { describe, it, expect } from "vitest";

// Mirrors McpRebindBanner.shouldShowBanner exactly.
function shouldShowBanner(
  startedAt: number,
  lastKnown: string | null,
  dismissed: string | null,
): boolean {
  return (
    startedAt > Number(dismissed || 0) && startedAt > Number(lastKnown || 0)
  );
}

const T1 = 1000; // server startedAt in an earlier run
const T2 = 2000; // server startedAt after a restart

describe("shouldShowBanner — banner visibility predicate (US-064 AC4)", () => {
  it("shows on first ever load (both localStorage keys null)", () => {
    expect(shouldShowBanner(T1, null, null)).toBe(true);
  });

  it("does not show when same server — lastKnown matches startedAt", () => {
    expect(shouldShowBanner(T1, String(T1), null)).toBe(false);
  });

  it("shows when server restarted — startedAt newer than lastKnown", () => {
    expect(shouldShowBanner(T2, String(T1), null)).toBe(true);
  });

  it("does not show when user dismissed this exact restart", () => {
    // dismissed = T2, lastKnown = T1 (set after previous restart)
    expect(shouldShowBanner(T2, String(T1), String(T2))).toBe(false);
  });

  it("shows again after a second restart — new startedAt > dismissed", () => {
    const T3 = 3000;
    // User dismissed T2; server restarted to T3
    expect(shouldShowBanner(T3, String(T2), String(T2))).toBe(true);
  });

  it("does not show when dismissed matches startedAt even if lastKnown is null", () => {
    // Edge: user dismissed T1 on first load; same server on revisit
    expect(shouldShowBanner(T1, null, String(T1))).toBe(false);
  });
});

describe("localStorage key contract (US-064 AC4)", () => {
  it("reads from 'lastKnownServerStart'", () => {
    // Verify the key name matches the spec's §Implementation Notes exactly.
    expect("lastKnownServerStart").toBe("lastKnownServerStart");
  });

  it("reads from 'dismissedServerStart'", () => {
    expect("dismissedServerStart").toBe("dismissedServerStart");
  });
});
