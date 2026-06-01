"use client";

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
