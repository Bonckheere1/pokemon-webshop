import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import "./seed";
import { productsRouter } from "./routes/products";
import { boxesRouter } from "./routes/boxes";
import { cartRouter } from "./routes/cart";
import { imageProxyRouter } from "./routes/imageProxy";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (!req.cookies?.sessionId) {
    const sessionId = crypto.randomUUID();
    res.cookie("sessionId", sessionId, { httpOnly: true, sameSite: "lax" });
    req.cookies.sessionId = sessionId;
  }
  next();
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/products", productsRouter);
app.use("/api/boxes", boxesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/image-proxy", imageProxyRouter);

app.listen(PORT, () => {
  console.log(`Pokémon webshop API listening on port ${PORT}`);
});
