"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage, RoleId } from "@/types";

const ROLE_LABEL: Record<RoleId, string> = {
  "product-owner": "Product Owner",
  "business-analyst": "Business Analyst",
  architect: "Architect",
  "ui-developer": "UI Developer",
  "backend-developer": "Backend Developer",
  qa: "QA",
  devsecops: "DevSecOps",
  "ux-designer": "UX Designer",
};

const COLLAPSE_CHARS = 200;
const COLLAPSE_LINES = 3;

function getPreview(content: string) {
  const lines = content.split("\n");
  const byLines = lines.slice(0, COLLAPSE_LINES).join("\n");
  const byChars = content.slice(0, COLLAPSE_CHARS);
  // Use whichever captures less content (shorter string = less shown)
  const preview = byLines.length <= byChars.length ? byLines : byChars;
  const hasMore = preview.length < content.trimEnd().length;
  const extraLines = Math.max(0, lines.length - COLLAPSE_LINES);
  return { preview, hasMore, extraLines };
}

interface Props {
  message: ChatMessage;
  /** The role this pane belongs to — used to pick "you" vs "teammate" framing. */
  perspective: RoleId;
  /** Streaming preview of an in-flight reply (no DB id yet). */
  pending?: boolean;
}

export function MessageBubble({ message, perspective, pending }: Props) {
  const { author, content } = message;
  const isLong = (content?.length ?? 0) > COLLAPSE_CHARS;
  // Outbound routing bubbles (handoff-out / dispatch-out) are status signals, not reading material.
  // Derive from author before useState so hooks order stays stable.
  const isOutbound =
    (author.kind === "handoff" && author.to !== perspective) ||
    (author.kind === "dispatch" && author.to !== perspective);
  const [expanded, setExpanded] = useState(isOutbound ? false : !isLong);

  let label = "";
  let tone:
    | "user"
    | "self"
    | "peer"
    | "handoff-in"
    | "handoff-out"
    | "dispatch-in"
    | "dispatch-out"
    | "system" = "system";

  switch (author.kind) {
    case "user":
      label = "You (user)";
      tone = "user";
      break;
    case "agent":
      if (author.role === perspective) {
        label = `${ROLE_LABEL[author.role]} (you)`;
        tone = "self";
      } else {
        label = `${ROLE_LABEL[author.role]}`;
        tone = "peer";
      }
      break;
    case "orchestrator":
      label = "System note";
      tone = "system";
      break;
    case "handoff":
      if (author.to === perspective) {
        label = `↳ Handoff from ${ROLE_LABEL[author.from]}`;
        tone = "handoff-in";
      } else {
        label = `↳ Handoff to ${ROLE_LABEL[author.to]}`;
        tone = "handoff-out";
      }
      break;
    case "dispatch":
      if (author.to === perspective) {
        label = `⇩ Dispatch from Product Owner`;
        tone = "dispatch-in";
      } else {
        label = `⇩ PO dispatched ${ROLE_LABEL[author.to]}`;
        tone = "dispatch-out";
      }
      break;
  }

  const { preview, hasMore, extraLines } = getPreview(content || "");
  const displayContent = expanded || !hasMore ? content || " " : preview;
  const moreCopy = extraLines > 0 ? `+${extraLines} lines` : "more";

  const toggleExpand = () => setExpanded((e) => !e);

  const handleCollapseClick = (e: React.MouseEvent) => {
    // Don't intercept link navigation inside the markdown
    if ((e.target as HTMLElement).closest("a")) return;
    toggleExpand();
  };

  const handleCollapseKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpand();
    }
  };

  const collapsed = !expanded && hasMore;

  return (
    <div
      className={`bubble bubble-${tone}${collapsed ? " bubble-collapsed" : ""}`}
      onClick={collapsed ? handleCollapseClick : undefined}
      role={collapsed ? "button" : undefined}
      tabIndex={collapsed ? 0 : undefined}
      aria-expanded={hasMore ? expanded : undefined}
      onKeyDown={collapsed ? handleCollapseKey : undefined}
    >
      <div className="bubble-header">
        <span>{label}</span>
        {pending && <span className="pending-dot" aria-hidden />}
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
      </div>
      {collapsed && <div className="bubble-fade" aria-hidden />}
      {hasMore && (
        <button
          className="bubble-cta"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
          aria-label={expanded ? "Collapse message" : "Expand full message"}
        >
          {expanded ? "Collapse ▴" : `Show more (${moreCopy}) ▾`}
        </button>
      )}
      <style jsx>{`
        .bubble {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          background: var(--surface);
          max-width: 820px;
        }
        .bubble + .bubble { margin-top: 10px; }
        .bubble-collapsed { cursor: pointer; }
        .bubble-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-dim);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bubble-user { border-color: #3b4252; }
        .bubble-self { border-color: color-mix(in srgb, var(--accent-ui) 40%, var(--border)); }
        .bubble-peer {
          border-color: color-mix(in srgb, var(--accent-ba) 30%, var(--border));
          background: var(--surface-2);
        }
        .bubble-handoff-in,
        .bubble-handoff-out {
          border-style: dashed;
          border-color: var(--accent-po);
          background: color-mix(in srgb, var(--accent-po) 8%, var(--surface));
        }
        .bubble-dispatch-in,
        .bubble-dispatch-out {
          border-color: color-mix(in srgb, var(--accent-po) 60%, var(--border));
          background: color-mix(in srgb, var(--accent-po) 12%, var(--surface));
        }
        .bubble-system {
          border-style: dotted;
          background: color-mix(in srgb, var(--accent-po) 4%, var(--surface));
        }
        .pending-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-ui);
          animation: pulse 1.1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes rm-pending-dot-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pending-dot {
            animation: rm-pending-dot-pulse 1.5s ease-in-out infinite;
          }
        }
        .bubble-fade {
          height: 24px;
          margin-top: -24px;
          background: linear-gradient(transparent, var(--surface));
          pointer-events: none;
          position: relative;
          z-index: 1;
        }
        /* For non-default-surface bubbles, the fade blends imperfectly but the gradient
           still signals "there's more" — acceptable for this density-control affordance. */
        .bubble-cta {
          display: block;
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-dim);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          position: relative;
          z-index: 1;
        }
        .bubble-cta:hover { color: var(--text); }
        .bubble-cta:focus-visible {
          outline: 1px solid var(--accent-ui);
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
