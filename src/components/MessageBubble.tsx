"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage, RoleId } from "@/types";

const ROLE_LABEL: Record<RoleId, string> = {
  "business-analyst": "Business Analyst",
  developer: "Developer",
  orchestrator: "Orchestrator",
};

interface Props {
  message: ChatMessage;
  /** The role this pane belongs to — used to pick "you" vs "teammate" framing. */
  perspective: RoleId;
  /** Streaming preview of an in-flight reply (no DB id yet). */
  pending?: boolean;
}

export function MessageBubble({ message, perspective, pending }: Props) {
  const { author, content } = message;

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
      label = "Orchestrator (system)";
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
        label = `⇩ Dispatch from Orchestrator`;
        tone = "dispatch-in";
      } else {
        label = `⇩ Dispatched to ${ROLE_LABEL[author.to]}`;
        tone = "dispatch-out";
      }
      break;
  }

  return (
    <div className={`bubble bubble-${tone}`}>
      <div className="bubble-header">
        <span>{label}</span>
        {pending && <span className="pending-dot" aria-hidden />}
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || " "}</ReactMarkdown>
      </div>
      <style jsx>{`
        .bubble {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          background: var(--surface);
        }
        .bubble + .bubble {
          margin-top: 10px;
        }
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
        .bubble-self {
          border-color: color-mix(in srgb, var(--accent-dev) 40%, var(--border));
        }
        .bubble-peer {
          border-color: color-mix(in srgb, var(--accent-ba) 30%, var(--border));
          background: var(--surface-2);
        }
        .bubble-handoff-in,
        .bubble-handoff-out {
          border-style: dashed;
          border-color: var(--accent-orch);
          background: color-mix(in srgb, var(--accent-orch) 8%, var(--surface));
        }
        .bubble-dispatch-in,
        .bubble-dispatch-out {
          border-color: color-mix(in srgb, var(--accent-orch) 60%, var(--border));
          background: color-mix(in srgb, var(--accent-orch) 12%, var(--surface));
        }
        .bubble-system {
          border-style: dotted;
          background: color-mix(in srgb, var(--accent-orch) 4%, var(--surface));
        }
        .pending-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-dev);
          animation: pulse 1.1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
