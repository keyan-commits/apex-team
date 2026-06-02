import { describe, it, expect } from "vitest";
import { augmentSystemPrompt, buildConversation, MAX_SYSTEM_PROMPT_CHARS } from "@/lib/providers";
import type { AgentTurnContext } from "@/lib/providers";
import type { ChatMessage, RoleDefinition } from "@/types";

// White-box test for the static-before-volatile section ordering invariant
// (Fix 1 / Wave 73). The claude_code preset caches on a byte-stable prefix —
// skills (large, static) must appear BEFORE HANDOFF/inbox (volatile) so the
// cache breakpoint covers as much content as possible.
function makeRole(systemPrompt: string, skills?: string): RoleDefinition {
  return {
    id: "qa",
    label: "QA",
    shortLabel: "QA",
    accent: "qa",
    systemPrompt,
    ...(skills ? { skills } : {}),
  };
}

describe("providers — static-before-volatile ordering (Fix 1 / Wave 73)", () => {
  it("buildConversation is unaffected by the reorder", () => {
    // sanity: the conversation builder should still work correctly
    const messages: ChatMessage[] = [
      { author: { kind: "user" }, content: "hello", id: 1, threadId: "t", createdAt: 0 },
    ];
    const result = buildConversation("qa", messages);
    expect(result.length).toBe(1);
    expect(result[0].role).toBe("user");
  });

  it("skills section appears before handoffDoc in the augmented prompt", () => {
    const SKILLS_SENTINEL = "SKILLS_SENTINEL_UNIQUE_abc123";
    const HANDOFF_SENTINEL = "HANDOFF_SENTINEL_UNIQUE_xyz789";

    const role = makeRole("System prompt text.", SKILLS_SENTINEL);
    const ctx: AgentTurnContext = {
      handoffDoc: HANDOFF_SENTINEL,
      pendingInbox: [],
    };

    const result = augmentSystemPrompt(role, ctx);
    const skillsIdx = result.indexOf(SKILLS_SENTINEL);
    const handoffIdx = result.indexOf(HANDOFF_SENTINEL);
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(handoffIdx).toBeGreaterThan(-1);
    expect(skillsIdx).toBeLessThan(handoffIdx);
  });

  it("when skills is absent, handoffDoc still appears after systemPrompt", () => {
    const SYSTEM_SENTINEL = "SYSTEM_SENTINEL_UNIQUE_abc";
    const HANDOFF_SENTINEL = "HANDOFF_SENTINEL_UNIQUE_abc";

    const role = makeRole(SYSTEM_SENTINEL);
    const ctx: AgentTurnContext = {
      handoffDoc: HANDOFF_SENTINEL,
      pendingInbox: [],
    };

    const result = augmentSystemPrompt(role, ctx);
    expect(result.indexOf(SYSTEM_SENTINEL)).toBeLessThan(result.indexOf(HANDOFF_SENTINEL));
  });

  it("inbox appears after handoffDoc", () => {
    const SKILLS_SENTINEL = "SKILLS_BLOCK_abc";
    const HANDOFF_SENTINEL = "HANDOFF_BLOCK_abc";
    const INBOX_SENTINEL = "INBOX_BLOCK_abc";

    const role = makeRole("sys", SKILLS_SENTINEL);
    const inboxMsg: ChatMessage = {
      author: { kind: "handoff", from: "architect", to: "qa" },
      content: INBOX_SENTINEL,
      id: 2,
      threadId: "t",
      createdAt: 0,
    };
    const ctx: AgentTurnContext = {
      handoffDoc: HANDOFF_SENTINEL,
      pendingInbox: [inboxMsg],
    };

    const result = augmentSystemPrompt(role, ctx);
    const skillsIdx = result.indexOf(SKILLS_SENTINEL);
    const handoffIdx = result.indexOf(HANDOFF_SENTINEL);
    const inboxIdx = result.indexOf(INBOX_SENTINEL);
    expect(skillsIdx).toBeLessThan(handoffIdx);
    expect(handoffIdx).toBeLessThan(inboxIdx);
  });
});

describe("augmentSystemPrompt — MAX_SYSTEM_PROMPT_CHARS guard", () => {
  const makeMsg = (content: string, id: number): ChatMessage => ({
    id,
    threadId: "t1",
    author: { kind: "handoff", from: "architect", to: "backend-developer" },
    content,
    createdAt: id,
  });

  it("under limit: returns full text with no truncation marker", () => {
    const role = makeRole("short system prompt");
    const ctx: AgentTurnContext = { handoffDoc: "small handoff", pendingInbox: [] };
    const result = augmentSystemPrompt(role, ctx);
    expect(result).not.toMatch(/\[truncated \d+ chars\]/);
    expect(result.length).toBeLessThanOrEqual(MAX_SYSTEM_PROMPT_CHARS);
  });

  it("over limit via large HANDOFF: output fits within MAX_SYSTEM_PROMPT_CHARS", () => {
    const role = makeRole("sys");
    const ctx: AgentTurnContext = {
      handoffDoc: "x".repeat(120_000),
      pendingInbox: [],
    };
    const result = augmentSystemPrompt(role, ctx);
    expect(result.length).toBeLessThanOrEqual(MAX_SYSTEM_PROMPT_CHARS);
  });

  it("over limit via large HANDOFF: includes a [truncated N chars] marker", () => {
    const role = makeRole("sys");
    const ctx: AgentTurnContext = {
      handoffDoc: "x".repeat(120_000),
      pendingInbox: [],
    };
    const result = augmentSystemPrompt(role, ctx);
    expect(result).toMatch(/\[truncated \d+ chars\]/);
  });

  it("over limit: role systemPrompt is never truncated", () => {
    const SENTINEL = "ROLE_PROMPT_SENTINEL_NEVER_TRUNCATED_abc123";
    const role = makeRole(SENTINEL);
    const ctx: AgentTurnContext = {
      handoffDoc: "x".repeat(120_000),
      pendingInbox: [],
    };
    const result = augmentSystemPrompt(role, ctx);
    expect(result).toContain(SENTINEL);
  });

  it("over limit via large inbox: oldest item is dropped first, newest is preserved", () => {
    const role = makeRole("sys");
    const OLD_SENTINEL = "OLDEST_INBOX_abc999";
    const NEW_SENTINEL = "NEWEST_INBOX_abc999";
    const ctx: AgentTurnContext = {
      handoffDoc: "small handoff",
      pendingInbox: [
        // Oldest: big enough to push total over MAX when combined with newest.
        makeMsg(`${OLD_SENTINEL} ${"x".repeat(99_950)}`, 1),
        // Newest: small — should survive after oldest is dropped.
        makeMsg(NEW_SENTINEL, 2),
      ],
    };
    const result = augmentSystemPrompt(role, ctx);
    expect(result.length).toBeLessThanOrEqual(MAX_SYSTEM_PROMPT_CHARS);
    expect(result).not.toContain(OLD_SENTINEL);
    expect(result).toContain(NEW_SENTINEL);
    expect(result).toMatch(/\[truncated \d+ chars\]/);
  });
});
