import { Router } from "express";
import { db } from "../db";

export const boxesRouter = Router();

boxesRouter.get("/", (_req, res) => {
  const boxes = db.prepare("SELECT * FROM products WHERE category = 'box' ORDER BY id").all();
  res.json(boxes);
});
