import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/incidencias
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
      SELECT i.*, c.nombre as conductor_nombre, c.apellidos as conductor_apellidos 
      FROM incidencias i
      LEFT JOIN conductores c ON i.conductor_id = c.id
      ORDER BY i.fecha_creacion DESC
    `);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/incidencias
router.post('/', async (req, res, next) => {
    try {
        const { titulo, descripcion, tipo, conductor_id } = req.body;
        const [result] = await pool.query(
            `INSERT INTO incidencias (titulo, descripcion, tipo, conductor_id) VALUES (?, ?, ?, ?)`,
            [titulo, descripcion, tipo, conductor_id]
        );
        res.status(201).json({ id: result.insertId, message: 'Incidencia creada' });
    } catch (error) {
        next(error);
    }
});

export default router;
