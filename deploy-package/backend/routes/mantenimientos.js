import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { estado, autobus_id } = req.query;
    let sql = `SELECT m.*, b.matricula, b.modelo
               FROM mantenimientos m
               JOIN autobuses b ON m.autobus_id = b.id`;
    const clauses = [];
    const params = [];
    if (estado) {
      clauses.push("m.estado = ?");
      params.push(estado);
    }
    if (autobus_id) {
      clauses.push("m.autobus_id = ?");
      params.push(autobus_id);
    }
    if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
    sql += " ORDER BY m.fecha_programada DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      autobus_id,
      tipo,
      descripcion,
      fecha_programada,
      fecha_realizacion,
      coste,
      estado = "pendiente",
    } = req.body;
    if (!autobus_id || !tipo || !fecha_programada) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const [result] = await pool.query(
      `INSERT INTO mantenimientos (autobus_id, tipo, descripcion, fecha_programada, fecha_realizacion, coste, estado)
       VALUES (?,?,?,?,?,?,?)`,
      [autobus_id, tipo, descripcion || null, fecha_programada, fecha_realizacion || null, coste || null, estado]
    );
    const [rows] = await pool.query("SELECT * FROM mantenimientos WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const fields = [
      "autobus_id",
      "tipo",
      "descripcion",
      "fecha_programada",
      "fecha_realizacion",
      "coste",
      "estado",
    ];
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
    const [result] = await pool.query(`UPDATE mantenimientos SET ${updates.join(", ")} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Mantenimiento no encontrado" });
    const [rows] = await pool.query("SELECT * FROM mantenimientos WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM mantenimientos WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Mantenimiento no encontrado" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
