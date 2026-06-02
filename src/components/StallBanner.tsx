"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  active: boolean;
  onDismiss: () => void;
}

export function StallBanner({ active, onDismiss }: Props) {
  const [mounted, setMounted] = useState(active);
  const [leaving, setLeaving] = useState(false);
  const prevActiveRef = useRef(active);

  useEffect(() => {
    if (active === prevActiveRef.current) return;
    prevActiveRef.current = active;

    if (active) {
      setLeaving(false);
      setMounted(true);
    } else if (mounted) {
      setLeaving(true);
      const t = setTimeout(() => {
        setMounted(false);
        setLeaving(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [active, mounted]);

  if (!mounted) return null;

  return (
    <aside
      role="alert"
      aria-label="Stall notification"
      className={leaving ? "stall-banner leaving" : "stall-banner"}
    >
      <span className="stall-msg">
        Team stalled — no merge in &gt;60 min, backlog present.
      </span>
      <button
        type="button"
        className="stall-dismiss"
        onClick={onDismiss}
        title="Dismiss"
        aria-label="Dismiss stall notification"
      >
        ×
      </button>
      <style jsx>{`
        .stall-banner {
          display: flex;
          align-items: center;
          height: 48px;
          padding: 0 16px;
          background: #dc2626;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          gap: 12px;
          overflow: hidden;
          animation: stall-slide-down 200ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .stall-banner {
            animation: none;
          }
        }
        .stall-banner.leaving {
          animation: stall-slide-up 200ms ease-in forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .stall-banner.leaving {
            animation: none;
          }
        }
        @keyframes stall-slide-down {
          from { transform: translateY(-48px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes stall-slide-up {
          from { transform: translateY(0);     opacity: 1; }
          to   { transform: translateY(-48px); opacity: 0; }
        }
        .stall-msg {
          flex: 1;
        }
        .stall-dismiss {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
          padding: 4px 8px;
          border-radius: 4px;
          flex-shrink: 0;
          transition: background 150ms;
        }
        .stall-dismiss:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .stall-dismiss:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }
      `}</style>
    </aside>
  );
}
