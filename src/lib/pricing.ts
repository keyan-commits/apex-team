export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheCreationPerMTok?: number;
  cacheReadPerMTok?: number;
}

// Reference public API pricing ($/MTok). User is on Claude subscriptions (fixed
// monthly) — actual cost is zero per-token. These rates are for benchmarking
// efficiency and projecting cost-if-on-API.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-8":          { inputPerMTok: 5,     outputPerMTok: 25,   cacheCreationPerMTok: 6.25,  cacheReadPerMTok: 0.5  },
  "claude-opus-4-7":          { inputPerMTok: 5,     outputPerMTok: 25,   cacheCreationPerMTok: 6.25,  cacheReadPerMTok: 0.5  },
  "claude-sonnet-4-6":        { inputPerMTok: 3,     outputPerMTok: 15,   cacheCreationPerMTok: 3.75,  cacheReadPerMTok: 0.3  },
  "claude-haiku-4-5-20251001":{ inputPerMTok: 1,     outputPerMTok: 5,    cacheCreationPerMTok: 1.25,  cacheReadPerMTok: 0.1  },
  "gemini-2.5-flash":         { inputPerMTok: 0.075, outputPerMTok: 0.30 },
  "llama-3.3-70b-versatile":  { inputPerMTok: 0.59,  outputPerMTok: 0.59 },
};

export function estimateCostUsd(
  model: string,
  usage: { input: number; output: number; cacheCreation?: number; cacheRead?: number },
): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (
    usage.input * p.inputPerMTok
    + usage.output * p.outputPerMTok
    + (usage.cacheCreation ?? 0) * (p.cacheCreationPerMTok ?? p.inputPerMTok)
    + (usage.cacheRead    ?? 0) * (p.cacheReadPerMTok    ?? p.inputPerMTok)
  ) / 1_000_000;
}
