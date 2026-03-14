type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const checkRateLimit = (key: string, options: RateLimitOptions) => {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    const bucket = { count: 1, resetAt };
    buckets.set(key, bucket);
    return { allowed: true, remaining: options.max - 1, resetAt };
  }

  if (existing.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, options.max - existing.count),
    resetAt: existing.resetAt,
  };
};

export const resetRateLimit = (key?: string) => {
  if (key) {
    buckets.delete(key);
    return;
  }
  buckets.clear();
};
