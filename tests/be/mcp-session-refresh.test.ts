// Unit tests for MCP session-refresh on server restart (#257).
//
// Verifies the boot-session-ID mechanism in handleMcpRequest:
//   1. initialize requests always succeed and receive Mcp-Session-Id header.
//   2. Non-initialize with absent session ID → 404.
//   3. Non-initialize with wrong session ID → 404.
//   4. Non-initialize with correct session ID → transport.handleRequest called.

import { vi, describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";

// vi.hoisted runs before vi.mock factories, so these refs are safe to close over.
const { mockConnect, mockHandleRequest } = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockHandleRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class MockMcpServer {
    connect = mockConnect;
  },
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: class MockTransport {
    handleRequest = mockHandleRequest;
  },
}));

vi.mock("../../src/mcp/tools", () => ({ registerApexTeamTools: vi.fn() }));

import { handleMcpRequest, BOOT_SESSION_ID } from "../../src/mcp/handler";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeReq(body: unknown, sessionId?: string): IncomingMessage {
  const emitter = new EventEmitter();
  Object.assign(emitter, {
    method: "POST",
    headers: sessionId ? { "mcp-session-id": sessionId } : {},
    setEncoding: vi.fn(),
  });
  process.nextTick(() => {
    emitter.emit("data", JSON.stringify(body));
    emitter.emit("end");
  });
  return emitter as unknown as IncomingMessage;
}

function makeRes() {
  const setHeaderCalls: [string, string][] = [];
  let _status = 200;
  let _body = "";

  const res = {
    writableEnded: false,
    headersSent: false,
    setHeader(name: string, value: string) {
      setHeaderCalls.push([name, value]);
    },
    writeHead(code: number) {
      _status = code;
    },
    write: vi.fn(),
    end(data?: string) {
      _body = data ?? "";
      (res as { writableEnded: boolean }).writableEnded = true;
    },
  } as unknown as ServerResponse;

  return {
    res,
    setHeaderCalls,
    getStatus: () => _status,
    getBody: () => _body,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP session refresh on restart (#257)", () => {
  beforeEach(() => {
    mockConnect.mockClear();
    mockHandleRequest.mockClear();
  });

  it("BOOT_SESSION_ID is a UUID-shaped string", () => {
    expect(typeof BOOT_SESSION_ID).toBe("string");
    expect(BOOT_SESSION_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("initialize: sets Mcp-Session-Id header and delegates to transport", async () => {
    const req = makeReq({ jsonrpc: "2.0", method: "initialize", id: 1, params: {} });
    const { res, setHeaderCalls, getStatus } = makeRes();

    await handleMcpRequest(req, res);

    const sessionHeader = setHeaderCalls.find(([name]) => name === "Mcp-Session-Id");
    expect(sessionHeader).toBeDefined();
    expect(sessionHeader?.[1]).toBe(BOOT_SESSION_ID);
    expect(mockHandleRequest).toHaveBeenCalledOnce();
    expect(getStatus()).toBe(200);
  });

  it("non-initialize with no session ID: 404, transport not called", async () => {
    const req = makeReq({ jsonrpc: "2.0", method: "tools/list", id: 2 });
    const { res, getStatus, getBody } = makeRes();

    await handleMcpRequest(req, res);

    expect(getStatus()).toBe(404);
    expect(mockHandleRequest).not.toHaveBeenCalled();
    const parsed = JSON.parse(getBody()) as { error: { code: number }; id: number };
    expect(parsed.error.code).toBe(-32001);
    expect(parsed.id).toBe(2);
  });

  it("non-initialize with stale session ID: 404, transport not called", async () => {
    const req = makeReq(
      { jsonrpc: "2.0", method: "tools/call", id: 3, params: { name: "new_thread" } },
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    const { res, getStatus } = makeRes();

    await handleMcpRequest(req, res);

    expect(getStatus()).toBe(404);
    expect(mockHandleRequest).not.toHaveBeenCalled();
  });

  it("non-initialize with correct BOOT_SESSION_ID: transport called, no 404", async () => {
    const req = makeReq(
      { jsonrpc: "2.0", method: "tools/call", id: 4, params: { name: "new_thread" } },
      BOOT_SESSION_ID,
    );
    const { res, getStatus } = makeRes();

    await handleMcpRequest(req, res);

    expect(getStatus()).toBe(200);
    expect(mockHandleRequest).toHaveBeenCalledOnce();
  });
});
