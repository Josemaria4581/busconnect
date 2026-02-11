import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ping } from "./db.js";
import rutasRouter from "./routes/rutas.js";
import autobusesRouter from "./routes/autobuses.js";
import conductoresRouter from "./routes/conductores.js";
import asignacionesRouter from "./routes/asignaciones.js";
import mantenimientosRouter from "./routes/mantenimientos.js";
import viajesRouter from "./routes/viajesDiscrecionales.js";
import notificacionesRouter from "./routes/notificaciones.js";
import authRoutes from "./routes/auth.js";
import incidenciasRouter from "./routes/incidencias.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", async (_req, res, next) => {
  try {
    await ping();
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.use("/rutas", rutasRouter);
app.use("/autobuses", autobusesRouter);
app.use("/conductores", conductoresRouter);
app.use("/asignaciones", asignacionesRouter);
app.use("/mantenimientos", mantenimientosRouter);
app.use("/viajes-discrecionales", viajesRouter);
app.use("/notificaciones", notificacionesRouter);
app.use("/auth", authRoutes);
app.use("/incidencias", incidenciasRouter);
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... (existing API routes)

app.use("/tickets", ticketsRouter);

// Endpoint para regenerar la base de datos (SOLO PARA PRUEBAS)
import { seed } from "./seed.js";
app.post("/api/seed", async (req, res) => {
  try {
    await seed();
    res.json({ message: "Base de datos regenerada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Middleware de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Error interno del servidor",
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
