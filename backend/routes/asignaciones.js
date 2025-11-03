import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { estado, fecha } = req.query;
    let sql = `SELECT a.*, r.nombre AS ruta_nombre, b.matricula, c.nombre AS conductor_nombre
               FROM asignaciones a
               JOIN rutas r ON a.ruta_id = r.id
               JOIN autobuses b ON a.autobus_id = b.id
               JOIN conductores c ON a.conductor_id = c.id`;
    const clauses = [];
    const params = [];
    if (estado) {
      clauses.push("a.estado = ?");
      params.push(estado);
    }
    if (fecha) {
      clauses.push("DATE(a.fecha_salida) = ?");
      params.push(fecha);
    }
    if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
    sql += " ORDER BY a.fecha_salida DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, r.nombre AS ruta_nombre, b.matricula, c.nombre AS conductor_nombre
       FROM asignaciones a
       JOIN rutas r ON a.ruta_id = r.id
       JOIN autobuses b ON a.autobus_id = b.id
       JOIN conductores c ON a.conductor_id = c.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Asignación no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { ruta_id, autobus_id, conductor_id, fecha_salida, fecha_llegada, estado = "programado" } = req.body;
    if (!ruta_id || !autobus_id || !conductor_id || !fecha_salida || !fecha_llegada) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const [result] = await pool.query(
      `INSERT INTO asignaciones (ruta_id, autobus_id, conductor_id, fecha_salida, fecha_llegada, estado)
       VALUES (?,?,?,?,?,?)`,
      [ruta_id, autobus_id, conductor_id, fecha_salida, fecha_llegada, estado]
    );
    const [rows] = await pool.query("SELECT * FROM asignaciones WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const fields = ["ruta_id", "autobus_id", "conductor_id", "fecha_salida", "fecha_llegada", "estado"];
    const updates = [];
    const params = [];
    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE asignaciones SET ${updates.join(", ")} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Asignación no encontrada" });
    const [rows] = await pool.query("SELECT * FROM asignaciones WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM asignaciones WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Asignación no encontrada" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
