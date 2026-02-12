import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get tickets for a user
router.get("/", async (req, res, next) => {
    try {
        const { cliente_id } = req.query;
        if (!cliente_id) return res.status(400).json({ error: "Falta cliente_id" });

        const [rows] = await pool.query(`
      SELECT t.*, r.nombre as ruta_nombre, r.origen, r.destino, r.duracion_estimada_min 
      FROM tickets t
      JOIN rutas r ON t.ruta_id = r.id
      WHERE t.cliente_id = ?
      ORDER BY t.fecha_compra DESC
    `, [cliente_id]);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// Buy a ticket
router.post("/", async (req, res, next) => {
    try {
        const { cliente_id, ruta_id, fecha_viaje, precio } = req.body;
        if (!cliente_id || !ruta_id || !precio) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const [result] = await pool.query(
            "INSERT INTO tickets (cliente_id, ruta_id, fecha_viaje, precio) VALUES (?,?,?,?)",
            [cliente_id, ruta_id, fecha_viaje || null, precio]
        );

        const [rows] = await pool.query("SELECT * FROM tickets WHERE id = ?", [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

// Cancel a ticket
router.delete("/:id", async (req, res, next) => {
    try {
        // Soft delete/cancel
        const [result] = await pool.query("UPDATE tickets SET estado = 'cancelado' WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Ticket no encontrado" });
        res.json({ message: "Ticket cancelado" });
    } catch (error) {
        next(error);
    }
});

export default router;
