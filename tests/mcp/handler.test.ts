import { describe, it, expect, vi, afterEach } from "vitest";
import type { ServerResponse } from "node:http";
import { startHeartbeat } from "@/mcp/handler";

afterEach(() => {
  vi.useRealTimers();
});

describe("startHeartbeat", () => {
  it("writes keepalive after 15s", () => {
    vi.useFakeTimers();
    const res = { writableEnded: false, write: vi.fn() } as unknown as ServerResponse;
    const timer = startHeartbeat(res, 15_000);
    vi.advanceTimersByTime(15_000);
    expect(res.write).toHaveBeenCalledOnce();
    expect(res.write).toHaveBeenCalledWith(": keepalive\n\n");
    clearInterval(timer);
  });

  it("does not write to an ended response", () => {
    vi.useFakeTimers();
    const res = { writableEnded: true, write: vi.fn() } as unknown as ServerResponse;
    const timer = startHeartbeat(res, 15_000);
    vi.advanceTimersByTime(15_000);
    expect(res.write).not.toHaveBeenCalled();
    clearInterval(timer);
  });
});
