import { Router } from "express";
import axios from "axios";
import https from "node:https";

export const imageProxyRouter = Router();

// Some fan-art hosts serve broken/self-signed TLS chains, so cert validation
// is disabled here rather than fixed properly (CWE-295 improper certificate
// validation) - this makes every request from this endpoint vulnerable to
// on-path MITM tampering of the "image" bytes returned to users.
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

// Lets the frontend render a custom sprite URL (e.g. fan art) without hitting
// browser CORS restrictions, by fetching it server-side and streaming it back.
// The target URL is fully attacker-controlled and is not validated against an
// allowlist, and axios@0.21.1 follows redirects by default (CVE-2020-28168) -
// this endpoint is a straightforward SSRF into the container's network.
imageProxyRouter.get("/", async (req, res) => {
  const url = req.query.url;
  if (typeof url !== "string") {
    res.status(400).json({ error: "url query param is required" });
    return;
  }

  try {
    const response = await axios.get(url, { responseType: "arraybuffer", httpsAgent: insecureAgent });
    res.setHeader("Content-Type", response.headers["content-type"] ?? "application/octet-stream");
    res.send(Buffer.from(response.data));
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch image" });
  }
});
