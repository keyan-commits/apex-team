import { createServer } from "node:http";
import { describe, it, expect } from "vitest";
import { applyHttpTimeouts } from "../../server";

describe("applyHttpTimeouts", () => {
  it("sets requestTimeout to 0", () => {
    const server = createServer();
    applyHttpTimeouts(server);
    expect(server.requestTimeout).toBe(0);
  });

  it("sets keepAliveTimeout to 65000ms", () => {
    const server = createServer();
    applyHttpTimeouts(server);
    expect(server.keepAliveTimeout).toBe(65_000);
  });

  it("sets headersTimeout to 66000ms", () => {
    const server = createServer();
    applyHttpTimeouts(server);
    expect(server.headersTimeout).toBe(66_000);
  });

  it("headersTimeout exceeds keepAliveTimeout (Node constraint)", () => {
    const server = createServer();
    applyHttpTimeouts(server);
    expect(server.headersTimeout).toBeGreaterThan(server.keepAliveTimeout);
  });
});
