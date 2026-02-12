import { Router } from "express";
import { pool } from "../db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = 'secreto_super_seguro_para_demo'; // En prod usar .env

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Faltan credenciales" });

        // Buscar en 'conductores' (empleados/admins)
        let [rows] = await pool.query("SELECT * FROM conductores WHERE email = ?", [email]);
        let user = rows[0];
        let type = 'employee';

        // Si no está, buscar en clientes (si existiera esa tabla con password)
        if (!user) {
            // Fallback for client if applicable, or just generic error
            [rows] = await pool.query("SELECT * FROM clientes WHERE email = ?", [email]);
            user = rows[0];
            type = 'client';
        }

        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        // Check pass
        // if password is not hashed in DB (legacy), compare directly? No, we just seeded hashed.
        const match = await bcrypt.compare(password, user.password || '');
        if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

        // Generate Token
        const payload = {
            id: user.id,
            email: user.email,
            role: type === 'client' ? 'cliente' : (user.rol || 'employee'),
            name: user.nombre
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.nombre,
                email: user.email,
                role: payload.role,
                avatar: user.imagen
            }
        });

    } catch (error) {
        next(error);
    }
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // 1. Verificar si ya existe en conductores
        const [existingDriver] = await pool.query("SELECT * FROM conductores WHERE email = ?", [email]);
        if (existingDriver.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        // 2. Verificar si ya existe en clientes
        const [existingClient] = await pool.query("SELECT * FROM clientes WHERE email = ?", [email]);
        if (existingClient.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insertar en clientes
        const [result] = await pool.query(
            "INSERT INTO clientes (nombre, email, password) VALUES (?, ?, ?)",
            [nombre, email, hashedPassword]
        );

        // 5. Auto-login (generar token)
        const newUserId = result.insertId;
        const payload = {
            id: newUserId,
            email: email,
            role: 'cliente',
            name: nombre
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

        res.status(201).json({
            message: "Usuario registrado correctamente",
            token,
            user: {
                id: newUserId,
                name: nombre,
                email: email,
                role: 'cliente'
            }
        });

    } catch (error) {
        next(error);
    }
});

export default router;
