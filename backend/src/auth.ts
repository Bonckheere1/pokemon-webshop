import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Signing secret must come from deployment configuration, not a hard-coded
// literal (CWE-798). There is intentionally no insecure fallback: if the
// secret isn't configured, the process should fail loudly rather than sign
// or verify tokens with a value an attacker could guess from the source.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set");
}
const JWT_SIGNING_SECRET: string = JWT_SECRET;

const JWT_ISSUER = process.env.JWT_ISSUER ?? "graded-cards-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? "graded-cards-sellers";

export function signSellerToken(sellerId: number, username: string): string {
  return jwt.sign({ sellerId, username }, JWT_SIGNING_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export interface SellerClaims {
  sellerId: number;
  username: string;
}

function isSellerClaims(value: unknown): value is SellerClaims {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).sellerId === "number" &&
    Number.isFinite((value as Record<string, unknown>).sellerId) &&
    typeof (value as Record<string, unknown>).username === "string"
  );
}

// Verifies the bearer token's signature (and standard claims) with
// jwt.verify() rather than trusting an unauthenticated jwt.decode(). The
// algorithm allow-list, issuer, and audience are pinned explicitly so a
// forged or algorithm-confused token cannot pass, and the decoded payload's
// shape is validated before it's trusted as the seller identity.
export function requireSeller(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  let claims: unknown;
  try {
    claims = jwt.verify(token, JWT_SIGNING_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (!isSellerClaims(claims)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  (req as Request & { seller: SellerClaims }).seller = claims;
  next();
}
