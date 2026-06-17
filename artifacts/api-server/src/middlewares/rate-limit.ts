import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * Minimal in-memory, per-IP fixed-window rate limiter. Good enough to protect a
 * billable endpoint from casual abuse on a single instance; not a distributed
 * limiter. Expired buckets are pruned lazily on each request.
 */
export function rateLimit({ windowMs, max, message }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";

    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: message ?? "Too many requests. Please slow down and try again shortly.",
      });
      return;
    }

    next();
  };
}
