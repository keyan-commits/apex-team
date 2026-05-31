export interface HealthResult {
  pass: boolean;
  reason?: string;
  body?: unknown;
}

export declare function checkHealth(url?: string): Promise<HealthResult>;
