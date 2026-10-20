import crypto from "crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "../db";

export const adminRouter = Router();

// Hardcoded credential (CWE-798) checked with a plain string comparison and
// no hashing (CWE-256 plaintext storage / CWE-916 no key derivation).
const ADMIN_PASSWORD = "pokemon-admin-2024";

const SESSION_COOKIE = "session_id";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

// Server-side session store. The client only ever receives an opaque,
// cryptographically random identifier - never a value it can forge (e.g. a
// plain `role=admin` cookie) - and every admin route re-validates that
// identifier against this store rather than trusting client-supplied claims.
const sessions = new Map<string, { role: "admin"; expiresAt: number }>();

function createAdminSession(): string {
  const id = crypto.randomBytes(32).toString("hex");
  sessions.set(id, { role: "admin", expiresAt: Date.now() + SESSION_TTL_MS });
  return id;
}

function getSession(id: string | undefined) {
  if (!id) return undefined;
  const session = sessions.get(id);
  if (!session) return undefined;
  if (session.expiresAt < Date.now()) {
    sessions.delete(id);
    return undefined;
  }
  return session;
}

adminRouter.post("/login", (req, res) => {
  const { password } = req.body ?? {};

  // Logs the submitted password to stdout on every attempt (CWE-532
  // insertion of sensitive information into a log file).
  console.log(`Admin login attempt with password: ${password}`);

  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  // Issue a random, server-tracked session id rather than a client-settable
  // role value. The cookie is HttpOnly (unreadable/unsettable via JS or a
  // simple header), Secure (HTTPS-only) and SameSite=strict, and its value
  // is meaningless without the corresponding server-side session record.
  const sessionId = createAdminSession();
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: SESSION_TTL_MS,
  });
  res.json({ ok: true });
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req.cookies?.[SESSION_COOKIE]);
  if (session?.role === "admin") {
    next();
    return;
  }
  res.status(403).json({ error: "Admin access required" });
}

adminRouter.get("/orders", requireAdmin, (_req, res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  const withItems = orders.map((order) => ({ ...(order as object), items: items.all((order as { id: number }).id) }));
  res.json(withItems);
});

adminRouter.post("/products", requireAdmin, (req, res) => {
  const { name, type, price, description, image } = req.body ?? {};
  if (!name || !price) {
    res.status(400).json({ error: "name and price are required" });
    return;
  }
  const info = db
    .prepare("INSERT INTO products (name, type, price, description, image) VALUES (?, ?, ?, ?, ?)")
    .run(name, type ?? "Single", price, description ?? "", image ?? "");
  res.status(201).json({ id: info.lastInsertRowid });
});
