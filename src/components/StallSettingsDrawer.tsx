"use client";

import { useEffect, useRef } from "react";

export interface StallSettings {
  banner: boolean;
  notification: boolean;
  audio: boolean;
}

export const DEFAULT_STALL_SETTINGS: StallSettings = {
  banner: true,
  notification: false,
  audio: false,
};

export const STALL_SETTINGS_KEY = "apex-team:stall-settings";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: StallSettings;
  onSettingsChange: (next: StallSettings) => void;
  onNotificationToggle: (checked: boolean) => void;
  notificationPermission: NotificationPermission | "unavailable" | null;
}

export function StallSettingsDrawer({
  open,
  onClose,
  settings,
  onSettingsChange,
  onNotificationToggle,
  notificationPermission,
}: Props) {
  const notifDisabled =
    notificationPermission === "denied" || notificationPermission === "unavailable";

  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog when it opens (AC4)
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".stall-drawer")) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  // Tab trap: keep focus within dialog while open (AC4)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(".stall-drawer button, .stall-drawer input")
      ).filter((el) => !(el as HTMLInputElement).disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
      <aside
        className="stall-drawer open"
        role="dialog"
        aria-modal="true"
        aria-label="Stall notification settings"
      >
        <div className="drawer-header">
          <span className="drawer-title">Stall notifications</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close stall settings"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.banner}
              onChange={(e) =>
                onSettingsChange({ ...settings, banner: e.target.checked })
              }
            />
            <div className="toggle-info">
              <span className="toggle-label">Banner</span>
              <span className="toggle-desc">Show dashboard red banner on stall.</span>
            </div>
          </label>

          <label
            className={`toggle-row${notifDisabled ? " toggle-disabled" : ""}`}
            title={
              notifDisabled
                ? "Browser notifications blocked. Check site settings."
                : undefined
            }
          >
            <input
              type="checkbox"
              checked={settings.notification && !notifDisabled}
              onChange={(e) => onNotificationToggle(e.target.checked)}
              disabled={notifDisabled}
            />
            <div className="toggle-info">
              <span className="toggle-label">Browser Notification</span>
              <span className="toggle-desc">Send browser push alerts when stalled.</span>
            </div>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.audio}
              onChange={(e) =>
                onSettingsChange({ ...settings, audio: e.target.checked })
              }
            />
            <div className="toggle-info">
              <span className="toggle-label">Audio</span>
              <span className="toggle-desc">Play alert sound on stall onset.</span>
            </div>
          </label>
        </div>
      </aside>
      )}

      <style jsx>{`
        .stall-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 300px;
          height: 100vh;
          background: var(--surface-2);
          border-left: 1px solid var(--border);
          z-index: 200;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 16px rgba(0, 0, 0, 0.25);
        }
        .stall-drawer.open {
          transform: translateX(0);
        }
        @media (max-width: 767px) {
          .stall-drawer {
            width: 90vw;
          }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .drawer-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .drawer-close {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 4px;
        }
        .drawer-close:hover {
          color: var(--text);
          background: var(--border);
        }
        .drawer-close:focus-visible {
          outline: 2px solid var(--accent-po);
          outline-offset: 2px;
        }

        .drawer-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          overflow-y: auto;
        }

        .toggle-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }
        .toggle-row input[type="checkbox"] {
          margin-top: 2px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .toggle-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .toggle-disabled input {
          cursor: not-allowed;
        }
        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .toggle-label {
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
        }
        .toggle-desc {
          font-size: 11px;
          color: var(--text-dim);
        }
      `}</style>
    </>
  );
}
