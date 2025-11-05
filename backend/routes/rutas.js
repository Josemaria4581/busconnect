import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/rutas?activo=1
router.get("/", async (req, res, next) => {
  try {
    const { activo } = req.query;
    let sql = "SELECT * FROM rutas";
    const params = [];
    if (activo !== undefined) {
      sql += " WHERE activo = ?";
      params.push(Number(activo) ? 1 : 0);
    }
    const [rows] = await pool.query(sql, params);
    // Parse JSON
    const mapped = rows.map(r => ({ ...r, paradas: JSON.parse(r.paradas || '[]') }));
    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// GET /api/rutas/:id
router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rutas WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Ruta no encontrada" });
    rows[0].paradas = JSON.parse(rows[0].paradas || '[]');
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/rutas
router.post("/", async (req, res, next) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      origen,
      destino,
      distancia_km,
      duracion_estimada_min,
      activo = 1,
      precio,
      paradas,
      imagen
    } = req.body;
    if (!codigo || !nombre || !origen || !destino || !distancia_km || !duracion_estimada_min) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const paradasStr = typeof paradas === 'object' ? JSON.stringify(paradas) : (paradas || '[]');

    const [result] = await pool.query(
      `INSERT INTO rutas (codigo, nombre, descripcion, origen, destino, distancia_km, duracion_estimada_min, activo, precio, paradas, imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, descripcion || null, origen, destino, distancia_km, duracion_estimada_min, activo ? 1 : 0, precio || 0, paradasStr, imagen || '']
    );
    const [rows] = await pool.query("SELECT * FROM rutas WHERE id = ?", [result.insertId]);
    rows[0].paradas = JSON.parse(rows[0].paradas || '[]');
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/rutas/:id
router.put("/:id", async (req, res, next) => {
  try {
    const fields = ["codigo", "nombre", "descripcion", "origen", "destino", "distancia_km", "duracion_estimada_min", "activo", "precio", "paradas", "imagen"];
    const updates = [];
    const params = [];
    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        let val = req.body[field];
        if (field === "activo") val = val ? 1 : 0;
        if (field === "paradas" && typeof val === 'object') val = JSON.stringify(val);
        params.push(val);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE rutas SET ${updates.join(", ")} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Ruta no encontrada" });
    const [rows] = await pool.query("SELECT * FROM rutas WHERE id = ?", [req.params.id]);
    rows[0].paradas = JSON.parse(rows[0].paradas || '[]');
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rutas/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM rutas WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Ruta no encontrada" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
