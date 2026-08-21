import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const COOKIE_NAME = "scout_admin_session";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

function sign(payload: object, secret: string): string {
  const body = base64url(JSON.stringify(payload));
  const sig = base64url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

function verify(token: unknown, secret: string): { exp: number } | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = base64url(crypto.createHmac("sha256", secret).update(body).digest());
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: number };
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload as { exp: number };
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function getToken(req: Request): string | null {
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export interface AdminAuth {
  login: (req: Request, res: Response) => void;
  logout: (req: Request, res: Response) => void;
  requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
}

export function createAdminAuth(): AdminAuth {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be set (min 12 chars)");
  }
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (min 32 chars)");
  }

  const attempts = new Map<string, { count: number; resetAt: number }>();

  function clientIp(req: Request): string {
    return req.ip ?? req.socket.remoteAddress ?? "unknown";
  }

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now > entry.resetAt) {
      attempts.set(ip, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
      return false;
    }
    return entry.count >= MAX_LOGIN_ATTEMPTS;
  }

  function login(req: Request, res: Response): void {
    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }
    const candidate = (req.body as { password?: unknown } | undefined)?.password;
    if (typeof candidate !== "string" || !safeEqual(candidate, password)) {
      const entry = attempts.get(ip);
      if (entry) entry.count += 1;
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    attempts.delete(ip);
    const token = sign({ exp: Date.now() + TOKEN_TTL_MS, jti: crypto.randomUUID() }, secret);
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL_MS / 1000}`,
    );
    res.json({ ok: true });
  }

  function logout(req: Request, res: Response): void {
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    );
    res.json({ ok: true });
  }

  function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const payload = verify(getToken(req), secret);
    if (!payload) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  }

  return { login, logout, requireAdmin };
}
