"use client";

import { useCallback, useEffect, useState } from "react";

// Pure predicate — extracted for unit testing.
// Returns true when the server has restarted since the last known start
// AND the user has not already dismissed this specific restart.
export function shouldShowBanner(
  startedAt: number,
  lastKnown: string | null,
  dismissed: string | null,
): boolean {
  return (
    startedAt > Number(dismissed || 0) && startedAt > Number(lastKnown || 0)
  );
}

export function McpRebindBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [currentStartedAt, setCurrentStartedAt] = useState<number | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const health = (await res.json()) as { startedAt?: number };
      if (!health.startedAt) return;

      const lastKnown = localStorage.getItem("lastKnownServerStart");
      const dismissed = localStorage.getItem("dismissedServerStart");

      setCurrentStartedAt(health.startedAt);

      if (shouldShowBanner(health.startedAt, lastKnown, dismissed)) {
        setShowBanner(true);
        setDismissing(false);
      }
      // Always update lastKnown so subsequent page loads can detect a new restart.
      localStorage.setItem("lastKnownServerStart", String(health.startedAt));
    } catch {
      // Network error — leave banner state unchanged.
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (currentStartedAt !== null) {
      localStorage.setItem("dismissedServerStart", String(currentStartedAt));
    }
    const prefersRM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersRM) {
      setShowBanner(false);
    } else {
      setDismissing(true);
    }
  }, [currentStartedAt]);

  // Mount check + re-check on visibility (catches restarts while tab was hidden).
  useEffect(() => {
    checkHealth();
    const onVisible = () => {
      if (document.visibilityState === "visible") checkHealth();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [checkHealth]);

  // Global Escape dismisses the banner.
  useEffect(() => {
    if (!showBanner) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showBanner, handleDismiss]);

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Server restart notification"
      className={`mcp-rebind-banner${dismissing ? " mcp-rebind-banner--dismissing" : ""}`}
      onTransitionEnd={(e) => {
        if (dismissing && e.propertyName === "opacity") setShowBanner(false);
      }}
    >
      <span className="mcp-rebind-banner-icon">ℹ</span>
      <span className="mcp-rebind-banner-text">
        Server restarted — run <code className="mcp-rebind-banner-code">/mcp</code> in Claude Code
        to reconnect.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="mcp-rebind-banner-close"
      >
        ✕
      </button>

      <style jsx>{`
        .mcp-rebind-banner {
          display: flex;
          align-items: center;
          min-height: 40px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-dim);
          border-left: 3px solid var(--accent-info);
          background: var(--surface-1);
          gap: 8px;
          opacity: 1;
        }
        .mcp-rebind-banner--dismissing {
          opacity: 0;
        }
        @media (prefers-reduced-motion: no-preference) {
          .mcp-rebind-banner--dismissing {
            transition: opacity 150ms ease-out;
          }
        }
        .mcp-rebind-banner-icon {
          flex-shrink: 0;
          font-size: 16px;
          line-height: 1;
        }
        .mcp-rebind-banner-text {
          flex: 1;
          word-break: break-word;
        }
        .mcp-rebind-banner-code {
          font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas,
            "DejaVu Sans Mono", monospace;
          font-size: 12px;
          background: color-mix(in srgb, var(--accent-info) 12%, transparent);
          padding: 0 3px;
          border-radius: 2px;
        }
        .mcp-rebind-banner-close {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-dim);
          font-size: 13px;
          padding: 0;
          border-radius: 2px;
          margin-left: 4px;
        }
        .mcp-rebind-banner-close:hover {
          color: var(--text);
        }
        .mcp-rebind-banner-close:focus-visible {
          outline: 2px solid var(--accent-info);
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .mcp-rebind-banner {
            align-items: flex-start;
            max-height: 80px;
          }
        }
      `}</style>
    </div>
  );
}
