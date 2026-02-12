import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { usuario, leido } = req.query;
    let sql = "SELECT * FROM notificaciones";
    const clauses = [];
    const params = [];
    if (usuario) {
      clauses.push("usuario = ?");
      params.push(usuario);
    }
    if (leido !== undefined) {
      clauses.push("leido = ?");
      params.push(leido === "1" ? 1 : 0);
    }
    if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
    sql += " ORDER BY fecha DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { usuario, titulo, cuerpo, tipo = "info" } = req.body;
    if (!usuario || !titulo) {
      return res.status(400).json({ error: "usuario y titulo son obligatorios" });
    }
    const [result] = await pool.query(
      "INSERT INTO notificaciones (usuario, titulo, cuerpo, tipo) VALUES (?,?,?,?)",
      [usuario, titulo, cuerpo || null, tipo]
    );
    const [rows] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/leido", async (req, res, next) => {
  try {
    const { leido = 1 } = req.body;
    const [result] = await pool.query("UPDATE notificaciones SET leido = ? WHERE id = ?", [leido ? 1 : 0, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Notificación no encontrada" });
    const [rows] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
