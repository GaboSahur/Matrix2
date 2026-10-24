import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as claudeRouter } from "./routes/pistas-claude.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// En producción definí ALLOWED_ORIGIN (ej: https://gabosahur.github.io) para que
// solo tu sitio pueda usar este servidor. Sin esa variable queda abierto (solo desarrollo).
const origenesPermitidos = process.env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors(origenesPermitidos ? { origin: origenesPermitidos } : undefined));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "numerax-claude" });
});

app.use("/api", claudeRouter);

app.listen(PORT, () => {
  console.log(`Servidor levantado en http://localhost:${PORT}`);
});
