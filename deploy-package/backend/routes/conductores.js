import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM conductores");
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM conductores WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Conductor no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { codigo, nombre, apellidos, telefono, email, fecha_alta, licencia, rol, imagen, activo = 1 } = req.body;
    if (!codigo || !nombre || !apellidos || !fecha_alta) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const [result] = await pool.query(
      `INSERT INTO conductores (codigo, nombre, apellidos, telefono, email, fecha_alta, licencia, rol, imagen, activo)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [codigo, nombre, apellidos, telefono || null, email || null, fecha_alta, licencia || null, rol || 'driver', imagen || null, activo ? 1 : 0]
    );
    const [rows] = await pool.query("SELECT * FROM conductores WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const fields = ["codigo", "nombre", "apellidos", "telefono", "email", "fecha_alta", "licencia", "rol", "imagen", "activo"];
    const updates = [];
    const params = [];
    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        params.push(field === "activo" ? (req.body[field] ? 1 : 0) : req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE conductores SET ${updates.join(", ")} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Conductor no encontrado" });
    const [rows] = await pool.query("SELECT * FROM conductores WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM conductores WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Conductor no encontrado" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
