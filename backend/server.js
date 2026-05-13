import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

import { ping } from "./db.js";
import { seed } from "./seed.js";
import rutasRouter from "./routes/rutas.js";
import autobusesRouter from "./routes/autobuses.js";
import conductoresRouter from "./routes/conductores.js";
import asignacionesRouter from "./routes/asignaciones.js";
import mantenimientosRouter from "./routes/mantenimientos.js";
import viajesRouter from "./routes/viajesDiscrecionales.js";
import notificacionesRouter from "./routes/notificaciones.js";
import authRoutes from "./routes/auth.js";
import incidenciasRouter from "./routes/incidencias.js";
import ticketsRouter from "./routes/tickets.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: true, // Permite cualquier origen que haga la petición
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

app.use("/api/rutas", rutasRouter);
app.use("/api/autobuses", autobusesRouter);
app.use("/api/conductores", conductoresRouter);
app.use("/api/asignaciones", asignacionesRouter);
app.use("/api/mantenimientos", mantenimientosRouter);
app.use("/api/viajes-discrecionales", viajesRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/auth", authRoutes);
app.use("/api/incidencias", incidenciasRouter);
app.use("/api/tickets", ticketsRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.post("/api/seed", async (req, res) => {
  try {
    await seed();
    res.json({ message: "Base de datos regenerada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(frontendPath, 'index.html'));
});


app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Error interno del servidor",
  });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log('--- SERVER v2.1 STARTED ---');
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}

export default app;
