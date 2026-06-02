export interface DoneItem {
  role: string;
  taskSummary: string;
  completedAt: number;
  commitSha?: string;
  tickets?: number[];
  waves?: number[];
}

export interface DoneGroup {
  key: string;
  rows: DoneItem[];
  waves: number[];
  tickets: number[];
  roles: string[];
  latestAt: number;
}

export function groupDone(done: DoneItem[]): DoneGroup[] {
  const groups: DoneGroup[] = [];
  for (const row of done) {
    const rowWaves = row.waves ?? [];
    const rowTickets = row.tickets ?? [];
    const last = groups[groups.length - 1];
    const sharesWave = last && rowWaves.length > 0 && last.waves.some((w) => rowWaves.includes(w));
    const sharesTicketFallback =
      last && last.waves.length === 0 && rowWaves.length === 0 &&
      rowTickets.length > 0 && last.tickets.some((t) => rowTickets.includes(t));
    const rowHour = Math.floor(row.completedAt / 3_600_000);
    const lastHour = last ? Math.floor(last.latestAt / 3_600_000) : -1;
    const sharesHour = !!last &&
      last.waves.length === 0 && last.tickets.length === 0 &&
      rowWaves.length === 0 && rowTickets.length === 0 &&
      rowHour === lastHour;
    if (sharesWave || sharesTicketFallback || sharesHour) {
      last.rows.push(row);
      for (const w of rowWaves) if (!last.waves.includes(w)) last.waves.push(w);
      for (const t of rowTickets) if (!last.tickets.includes(t)) last.tickets.push(t);
      if (!last.roles.includes(row.role)) last.roles.push(row.role);
      if (row.completedAt > last.latestAt) last.latestAt = row.completedAt;
    } else {
      const sortedW = [...rowWaves].sort((a, b) => a - b);
      const sortedT = [...rowTickets].sort((a, b) => a - b);
      const key = sortedW.length > 0
        ? `wave-${sortedW[0]}`
        : sortedT.length > 0
        ? `tickets-${sortedT.join("-")}`
        : `hour-${rowHour}`;
      groups.push({ key, rows: [row], waves: [...rowWaves], tickets: [...rowTickets], roles: [row.role], latestAt: row.completedAt });
    }
  }
  return groups;
}
