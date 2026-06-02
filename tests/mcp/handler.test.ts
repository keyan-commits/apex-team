import { describe, it, expect, vi, afterEach } from "vitest";
import type { ServerResponse } from "node:http";
import { startHeartbeat } from "@/mcp/handler";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("startHeartbeat", () => {
  it("fires an immediate first keepalive (~100ms) — defeats sub-interval client timeouts (#172)", () => {
    vi.useFakeTimers();
    const res = { writableEnded: false, write: vi.fn() } as unknown as ServerResponse;
    const handle = startHeartbeat(res, 5_000, 100);
    vi.advanceTimersByTime(100);
    expect(res.write).toHaveBeenCalledOnce();
    expect(res.write).toHaveBeenCalledWith(": keepalive\n\n");
    handle.stop();
  });

  it("then writes every intervalMs after first beat", () => {
    vi.useFakeTimers();
    const res = { writableEnded: false, write: vi.fn() } as unknown as ServerResponse;
    const handle = startHeartbeat(res, 5_000, 100);
    // First beat at 100ms.
    vi.advanceTimersByTime(100);
    // Then 5s, 10s, 15s.
    vi.advanceTimersByTime(15_000);
    expect(res.write).toHaveBeenCalledTimes(4); // 1 immediate + 3 interval
    handle.stop();
  });

  it("stop() cancels both immediate timer and recurring interval", () => {
    vi.useFakeTimers();
    const res = { writableEnded: false, write: vi.fn() } as unknown as ServerResponse;
    const handle = startHeartbeat(res, 5_000, 100);
    handle.stop();
    vi.advanceTimersByTime(60_000);
    expect(res.write).not.toHaveBeenCalled();
  });

  it("does not write to an ended response", () => {
    vi.useFakeTimers();
    const res = { writableEnded: true, write: vi.fn() } as unknown as ServerResponse;
    const handle = startHeartbeat(res, 5_000, 100);
    vi.advanceTimersByTime(15_000);
    expect(res.write).not.toHaveBeenCalled();
    handle.stop();
  });

  it("logs (console.warn) when write throws — diagnosable instead of silent (#172)", () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = {
      writableEnded: false,
      write: vi.fn(() => {
        throw new Error("broken pipe");
      }),
    } as unknown as ServerResponse;
    const handle = startHeartbeat(res, 5_000, 100);
    vi.advanceTimersByTime(100);
    expect(warnSpy).toHaveBeenCalledWith(
      "[mcp/handler] heartbeat write failed:",
      expect.any(Error),
    );
    handle.stop();
  });

  it("default intervalMs is now 5_000 (was 15_000) — covers tighter client timeouts (#172)", () => {
    vi.useFakeTimers();
    const res = { writableEnded: false, write: vi.fn() } as unknown as ServerResponse;
    const handle = startHeartbeat(res); // defaults
    // First beat at 100ms.
    vi.advanceTimersByTime(100);
    expect(res.write).toHaveBeenCalledTimes(1);
    // Next beat at 5s after first.
    vi.advanceTimersByTime(5_000);
    expect(res.write).toHaveBeenCalledTimes(2);
    handle.stop();
  });
});
