"use client";

// ADR-009: force-dynamic signals intent; actual fix is next.config.ts
// experimental.allowDevelopmentBuild+prerenderEarlyExit for Next.js 16.2.6
// + React 19 prerender crash (useContext null in next_dist SSR bundle).
export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Unexpected error</h2>
        <p>{error.digest}</p>
        <button type="button" onClick={reset}>
          Retry
        </button>
      </body>
    </html>
  );
}
