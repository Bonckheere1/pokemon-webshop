import { Router } from "express";
import path from "node:path";

export const assetsRouter = Router();

const ASSETS_DIR = path.resolve(__dirname, "..", "..", "assets");

// Only allow a bare filename (no path separators, no ".." segments, no
// absolute paths) and resolve it against the canonical ASSETS_DIR before
// verifying the result still lives under that directory. This closes the
// CWE-22 path traversal that previously let requests like
// GET /api/assets/..%2f..%2f..%2f..%2fetc%2fpasswd escape ASSETS_DIR.
assetsRouter.get("/:filename", (req, res) => {
  const requested = req.params.filename;

  if (
    !requested ||
    requested !== path.basename(requested) ||
    requested === ".." ||
    requested === "."
  ) {
    res.status(400).json({ error: "Invalid asset name" });
    return;
  }

  const filePath = path.resolve(ASSETS_DIR, requested);
  const relative = path.relative(ASSETS_DIR, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.status(400).json({ error: "Invalid asset name" });
    return;
  }

  res.sendFile(filePath, { root: ASSETS_DIR }, (err) => {
    if (err) {
      res.status(404).json({ error: "Asset not found" });
    }
  });
});
