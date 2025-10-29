-- Schema for SQLite
CREATE TABLE IF NOT EXISTS autobuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricula TEXT UNIQUE NOT NULL,
  modelo TEXT,
  capacidad INTEGER,
  fecha_compra TEXT,
  kilometros_totales INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'operativo',
  imagen TEXT -- Added to match frontend
);

CREATE TABLE IF NOT EXISTS conductores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  fecha_alta TEXT,
  licencia TEXT, -- Solo para conductores
  rol TEXT DEFAULT 'driver', -- driver, mechanic, admin_staff, cleaner, admin
  imagen TEXT,
  password TEXT, -- Hashed
  activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  telefono TEXT,
  password TEXT -- For simple auth
);

CREATE TABLE IF NOT EXISTS rutas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  origen TEXT,
  destino TEXT,
  distancia_km REAL,
  duracion_estimada_min INTEGER,
  activo INTEGER DEFAULT 1,
  precio REAL,
  paradas TEXT, -- JSON array
  imagen TEXT -- URL imagen
);

CREATE TABLE IF NOT EXISTS viajes_discrecionales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  origen TEXT,
  destino TEXT,
  fecha_salida TEXT,
  fecha_llegada TEXT,
  plazas INTEGER,
  precio_total REAL,
  estado TEXT DEFAULT 'pendiente',
  observaciones TEXT,
  motivo_rechazo TEXT,
  conductor_id INTEGER,
  autobus_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(cliente_id) REFERENCES clientes(id),
  FOREIGN KEY(conductor_id) REFERENCES conductores(id),
  FOREIGN KEY(autobus_id) REFERENCES autobuses(id)
);

CREATE TABLE IF NOT EXISTS mensajes_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viaje_id INTEGER,
  emisor TEXT,
  mensaje TEXT,
  fecha_envio TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(viaje_id) REFERENCES viajes_discrecionales(id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT,
  titulo TEXT,
  cuerpo TEXT,
  tipo TEXT,
  leido INTEGER DEFAULT 0,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mantenimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  autobus_id INTEGER,
  fecha_programada TEXT,
  fecha_realizacion TEXT,
  tipo TEXT,
  coste REAL,
  descripcion TEXT,
  estado TEXT,
  created_by TEXT,
  FOREIGN KEY(autobus_id) REFERENCES autobuses(id)
);

CREATE TABLE IF NOT EXISTS asignaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ruta_id INTEGER,
  autobus_id INTEGER,
  conductor_id INTEGER,
  fecha_asignacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ruta_id) REFERENCES rutas(id),
  FOREIGN KEY(autobus_id) REFERENCES autobuses(id),
  FOREIGN KEY(conductor_id) REFERENCES conductores(id)
);

CREATE TABLE IF NOT EXISTS incidencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT,
  descripcion TEXT,
  estado TEXT DEFAULT 'abierta', -- abierta, resuelta
  tipo TEXT, -- accidente, retraso, averia, otro
  conductor_id INTEGER,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(conductor_id) REFERENCES conductores(id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  ruta_id INTEGER,
  fecha_compra TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_viaje TEXT,
  precio REAL,
  estado TEXT DEFAULT 'activo', -- activo, cancelado, usado
  FOREIGN KEY(cliente_id) REFERENCES clientes(id),
  FOREIGN KEY(ruta_id) REFERENCES rutas(id)
);
