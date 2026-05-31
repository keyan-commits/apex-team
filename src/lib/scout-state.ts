// In-memory flag — cleared when the process restarts, which is fine since
// a restarted process means the scout is not running.
export let scoutRunning = false;

export function setScoutRunning(v: boolean): void {
  scoutRunning = v;
}
