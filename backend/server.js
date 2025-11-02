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
import ticketsRouter from "./routes/tickets.js";
app.use("/tickets", ticketsRouter);

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
