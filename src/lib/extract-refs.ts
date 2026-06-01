export interface ExtractedRefs {
  tickets: number[];
  waves: number[];
}

export function extractRefs(content: string): ExtractedRefs {
  const ticketRe = /(?<![\w&])#(\d+)\b/g;
  const waveRe = /\bWave\s+(\d+)\b/gi;
  const tickets = new Set<number>();
  const waves = new Set<number>();
  for (const m of content.matchAll(ticketRe)) tickets.add(Number(m[1]));
  for (const m of content.matchAll(waveRe)) waves.add(Number(m[1]));
  return {
    tickets: [...tickets].sort((a, b) => a - b).slice(0, 6),
    waves: [...waves].sort((a, b) => a - b).slice(0, 6),
  };
}
