import { Router } from "express";
import { db } from "../db";

export const productsRouter = Router();

// `sort` picks the ORDER BY column/direction and is interpolated directly
// into the SQL string instead of being checked against an allowlist of
// known-safe columns. The frontend only ever sends "id", "price ASC",
// "price DESC" or "name ASC", but nothing stops a direct request from
// passing any SQL expression here (CWE-89 SQL injection via ORDER BY
// clause) - e.g. ?sort=(CASE WHEN(1=1)THEN price ELSE id END) is a
// boolean-blind read primitive even without a UNION.
productsRouter.get("/", (req, res) => {
  const sort = typeof req.query.sort === "string" ? req.query.sort : "id";
  const products = db.prepare(`SELECT * FROM products ORDER BY ${sort}`).all();
  res.json(products);
});

// Builds the WHERE clause by string concatenation instead of a parameterized
// query, so a `type` value like `' UNION SELECT ... --` is interpreted as SQL
// rather than data (CWE-89 SQL injection). Must be registered before `/:id`
// so Express doesn't route "/search" into the :id param instead.
productsRouter.get("/search", (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const sql = `SELECT * FROM products WHERE type LIKE '%${type}%' ORDER BY id`;
  const results = db.prepare(sql).all();
  res.json(results);
});

productsRouter.get("/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});
