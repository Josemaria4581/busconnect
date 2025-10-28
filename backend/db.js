import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DB_PATH = process.env.DB_PATH || 'database.sqlite';

// Auto-init if not exists (simple check)
const dbExists = fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);

import bcrypt from 'bcryptjs';

if (!dbExists) {
  console.log('Inicializando base de datos SQLite...');
  try {
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    db.exec(schema);
    console.log('Esquema cargado.');
  } catch (err) {
    console.error('Error cargando esquema:', err);
  }
}

// Ensure default driver exists (Idempotent check)
try {
  const check = db.prepare("SELECT count(*) as count FROM conductores WHERE email = 'conductor@busmanager.com'");
  if (check.get().count === 0) {
    const hash = bcrypt.hashSync('conductor123', 10);
    const seed = db.prepare(`
        INSERT INTO conductores (codigo, nombre, apellidos, email, password, rol) 
        VALUES ('COND001', 'Juan', 'Pérez', 'conductor@busmanager.com', ?, 'driver')
      `);
    seed.run(hash);
    console.log('Usuario conductor por defecto creado.');
  }
} catch (e) {
  console.error("Error verificando conductor:", e);
}

// Wrapper to mimic mysql2/promise interface
export const pool = {
  query: async (sql, params = []) => {
    // Basic translation of ? to ? (better-sqlite3 supports ?, but let's be safe)
    // Actually better-sqlite3 supports ? binding.

    // Check if it's a SELECT
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    try {
      const stmt = db.prepare(sql);
      let rows;
      let result;

      if (isSelect) {
        rows = stmt.all(...params);
        return [rows, []]; // [regions, fields]
      } else {
        result = stmt.run(...params);
        // Map result to mysql2 format: { insertId, affectedRows }
        const meta = {
          insertId: result.lastInsertRowid,
          affectedRows: result.changes
        };
        return [meta, []];
      }
    } catch (err) {
      console.error('SQL Error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  },
  getConnection: async () => {
    return {
      ping: async () => true,
      release: () => { }
    };
  }
};

export async function ping() {
  return true; // SQLite is local file, always "alive" if file access works
}
