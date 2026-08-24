import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "../db";

export const adminRouter = Router();

// Hardcoded credential (CWE-798) checked with a plain string comparison and
// no hashing (CWE-256 plaintext storage / CWE-916 no key derivation).
const ADMIN_PASSWORD = "pokemon-admin-2024";

adminRouter.post("/login", (req, res) => {
  const { password } = req.body ?? {};

  // Logs the submitted password to stdout on every attempt (CWE-532
  // insertion of sensitive information into a log file).
  console.log(`Admin login attempt with password: ${password}`);

  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  // Authorization is just this cookie's literal value - it isn't signed or
  // tied to a server-side session, so anyone can set `role=admin` themselves
  // via document.cookie or a manual request header and skip the password
  // entirely (CWE-287 improper authentication / CWE-565 reliance on an
  // unvalidated, non-integrity-checked cookie). It's also not `httpOnly`, so
  // any XSS elsewhere on the site can read and exfiltrate it.
  res.cookie("role", "admin", { sameSite: "lax" });
  res.json({ ok: true });
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.cookies?.role === "admin") {
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
