import { describe, it, expect } from "vitest";
import { augmentSystemPrompt, buildConversation } from "@/lib/providers";
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
