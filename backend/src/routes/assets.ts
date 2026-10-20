import { Router } from "express";
import path from "node:path";

export const assetsRouter = Router();

const ASSETS_DIR = path.join(__dirname, "..", "..", "assets");

// path.join happily resolves ".." segments in the untrusted `filename` param,
// so a request like GET /api/assets/..%2f..%2f..%2f..%2fetc%2fpasswd escapes
// ASSETS_DIR entirely. There's no check that the resolved path still lives
// under ASSETS_DIR before reading it (CWE-22 path traversal).
assetsRouter.get("/:filename", (req, res) => {
  const filePath = path.join(ASSETS_DIR, req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "Asset not found" });
    }
  });
});
