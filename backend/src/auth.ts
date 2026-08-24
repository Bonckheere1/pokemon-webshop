import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Signing secret baked into source (CWE-798) - not that it matters much here,
// since nothing on the verification path actually checks the signature (see
// below).
const JWT_SECRET = "graded-cards-dev-secret";

export function signSellerToken(sellerId: number, username: string): string {
  return jwt.sign({ sellerId, username }, JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

export interface SellerClaims {
  sellerId: number;
  username: string;
}

// Reads the seller identity out of the Authorization header with jwt.decode()
// instead of jwt.verify(). decode() just base64-decodes the payload segment -
// it never checks the signature against JWT_SECRET, so a token with any
// junk (or empty) signature segment is trusted as-is. Anyone can mint a
// token claiming to be any sellerId with zero knowledge of the secret
// (CWE-347 improper verification of cryptographic signature): take a real
// token, swap the `sellerId` field in the (base64url-decoded) payload to any
// value, re-encode, and every requireSeller-gated route below accepts it.
export function requireSeller(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const claims = jwt.decode(token) as SellerClaims | null;
  if (!claims?.sellerId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  (req as Request & { seller: SellerClaims }).seller = claims;
  next();
}
