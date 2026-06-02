"use client";

import type { CiHealthData } from "@/types";
import { formatRelative } from "@/hooks/useCiHealth";

interface Props {
  ciHealth: CiHealthData | null;
}

export function CiHealthBanner({ ciHealth }: Props) {
  if (!ciHealth) return null;
  const { state, consecutiveReds, latestRun } = ciHealth;
  if (state !== "alarm" && state !== "recovering") return null;

  const isAlarm = state === "alarm";

  const detail = latestRun
    ? ` · last: ${latestRun.name} · ${formatRelative(latestRun.createdAt)}`
    : "";

  const copy = isAlarm
    ? `✕  main CI RED — ${consecutiveReds} consecutive failure${consecutiveReds !== 1 ? "s" : ""}${detail}`
    : `↻  main CI recovering — run in progress`;

  return (
    <div
      role={isAlarm ? "alert" : "status"}
      aria-live={isAlarm ? "assertive" : "polite"}
      className={`ci-banner ci-banner--${state}`}
    >
      <span className="ci-banner-copy">{copy}</span>

      <style jsx>{`
        .ci-banner {
          display: flex;
          align-items: flex-start;
          padding: 8px 16px;
          font-size: 13px;
          color: var(--text);
          border-left: 3px solid;
          line-height: 1.5;
        }
        .ci-banner--alarm {
          border-left-color: var(--accent-qa);
          background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface));
        }
        .ci-banner--recovering {
          border-left-color: var(--accent-po);
          background: color-mix(in srgb, var(--accent-po) 8%, var(--surface));
        }
        .ci-banner-copy {
          flex: 1;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
