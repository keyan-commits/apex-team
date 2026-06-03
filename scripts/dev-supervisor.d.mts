export interface SupervisorOptions {
  root?: string;
  graceMs?: number;
  doubleSignalWindowMs?: number;
  userOffPath?: string;
  pidFile?: string;
  restartSentinel?: string;
  exitFn?: (code: number) => void;
}

export declare class Supervisor {
  child: import("node:child_process").ChildProcess | null;
  /** @internal */ _shutdownState: "running" | "grace" | "escalated";
  /** @internal */ _firstSignalAt: number;
  constructor(opts?: SupervisorOptions);
  killChild(): Promise<void>;
  writeUserOff(signal: string): void;
  handleSignal(sig: string): void;
  checkStaleChildOnStartup(): void;
  spawnChild(): void;
  start(): void;
}
