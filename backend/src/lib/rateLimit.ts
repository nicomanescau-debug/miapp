import type { NextFunction, Request, Response } from "express";

const hits = new Map<string, number[]>();

// Small in-memory limiter, fine for this app's scale (single free-tier instance).
export function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      res.status(429).json({ error: "Demasiados intentos, esperá unos minutos" });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
