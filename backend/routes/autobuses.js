import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { estado } = req.query;
    let sql = "SELECT * FROM autobuses";
    const params = [];
    if (estado) {
      sql += " WHERE estado = ?";
      params.push(estado);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM autobuses WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Autobús no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { matricula, modelo, capacidad, fecha_compra, kilometros_totales = 0, estado = "operativo" } = req.body;
    if (!matricula || !modelo || !capacidad) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const [result] = await pool.query(
      `INSERT INTO autobuses (matricula, modelo, capacidad, fecha_compra, kilometros_totales, estado)
       VALUES (?,?,?,?,?,?)`,
      [matricula, modelo, capacidad, fecha_compra || null, kilometros_totales, estado]
    );
    const [rows] = await pool.query("SELECT * FROM autobuses WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const fields = ["matricula", "modelo", "capacidad", "fecha_compra", "kilometros_totales", "estado"];
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
    const [result] = await pool.query(`UPDATE autobuses SET ${updates.join(", ")} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Autobús no encontrado" });
    const [rows] = await pool.query("SELECT * FROM autobuses WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM autobuses WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Autobús no encontrado" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
