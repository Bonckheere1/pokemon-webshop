import { Router } from "express";
import crypto from "node:crypto";
import { db } from "../db";
import { signSellerToken } from "../auth";

export const sellerAuthRouter = Router();

// Unsalted MD5 (CWE-916 use of a broken/weak hash for password storage) -
// fast to compute and has no per-user salt, so a leaked table (e.g. via the
// SQL injection in graded-cards search) is crackable with an off-the-shelf
// rainbow table in seconds, not a slow, salted KDF like bcrypt/argon2.
function hashPassword(password: string): string {
  return crypto.createHash("md5").update(password).digest("hex");
}

sellerAuthRouter.post("/register", (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  try {
    const info = db
      .prepare("INSERT INTO sellers (username, password_hash) VALUES (?, ?)")
      .run(username, hashPassword(password));
    const token = signSellerToken(Number(info.lastInsertRowid), username);
    res.status(201).json({ token });
  } catch {
    res.status(409).json({ error: "Username already taken" });
  }
});

sellerAuthRouter.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const seller = db
    .prepare("SELECT id, username, password_hash FROM sellers WHERE username = ?")
    .get(username) as { id: number; username: string; password_hash: string } | undefined;

  if (!seller || seller.password_hash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json({ token: signSellerToken(seller.id, seller.username) });
});
