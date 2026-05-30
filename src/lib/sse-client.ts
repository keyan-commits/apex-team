import type { SseEvent } from "@/types";

// Minimal SSE consumer for fetch's ReadableStream body.
// Apex-team's /api/chat emits one JSON event per `data: ` line.
export async function consumeSse(
  res: Response,
  onEvent: (e: SseEvent) => void,
): Promise<void> {
  if (!res.body) throw new Error("response has no body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice("data: ".length)));
      } catch {
        // Drop malformed frames silently — better than killing the stream.
      }
    }
  }
}
