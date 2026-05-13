import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DB_PATH = process.env.DB_PATH || 'database.sqlite';


const dbExists = fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!dbExists) {
  console.log('Inicializando base de datos SQLite...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('Esquema cargado.');
  } catch (err) {
    console.error('Error cargando esquema:', err);
  }
}


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


export const pool = {
  query: async (sql, params = []) => {
    
    

    
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    try {
      const stmt = db.prepare(sql);
      let rows;
      let result;

      if (isSelect) {
        rows = stmt.all(...params);
        return [rows, []]; 
      } else {
        result = stmt.run(...params);
        
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
  return true; 
}
