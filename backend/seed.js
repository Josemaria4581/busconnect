import { pool } from './db.js';
import bcrypt from 'bcryptjs';

export async function seed() {
  console.log('Starting seed...');

  // 0. CLEANUP (Reverse order of dependencies)
  console.log('Cleaning up...');
  await pool.query('PRAGMA foreign_keys = OFF');
  try { await pool.query('DELETE FROM mensajes_chat'); } catch (e) { }
  try { await pool.query('DELETE FROM tickets'); } catch (e) { }
  try { await pool.query('DELETE FROM asignaciones'); } catch (e) { }
  try { await pool.query('DELETE FROM mantenimientos'); } catch (e) { }
  try { await pool.query('DELETE FROM viajes_discrecionales'); } catch (e) { }
  try { await pool.query('DELETE FROM incidencias'); } catch (e) { }
  try { await pool.query('DELETE FROM rutas'); } catch (e) { }
  try { await pool.query('DELETE FROM conductores'); } catch (e) { }
  try { await pool.query('DELETE FROM clientes'); } catch (e) { }
  try { await pool.query('DELETE FROM autobuses'); } catch (e) { }
  await pool.query('PRAGMA foreign_keys = ON');

  // 1. Buses
  console.log('Seeding Buses...');
  const busImages = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1557223562-6c77ef16210f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600793575654-910699b5e4d4?q=80&w=600&auto=format&fit=crop"
  ];
  const capacities = [19, 25, 35, 50, 55, 63, 71];
  const models = ['Mercedes-Benz Sprinter', 'Iveco Daily', 'Volvo 9700', 'Scania Touring', 'Irizar i8', 'Setra S 517', 'Neoplan Skyliner'];

  for (let i = 0; i < 20; i++) {
    const plate = `${1000 + i} ${String.fromCharCode(65 + i % 26)}${String.fromCharCode(66 + i % 26)}${String.fromCharCode(67 + i % 26)}`;
    const capacity = capacities[Math.floor(Math.random() * capacities.length)];
    const model = models[Math.floor(Math.random() * models.length)];

    await pool.query(`INSERT INTO autobuses (matricula, modelo, capacidad, kilometros_totales, estado, imagen) VALUES (?, ?, ?, ?, ?, ?)`,
      [plate, model, capacity, Math.floor(Math.random() * 300000) + 10000, 'operativo', busImages[i % 3]]
    );
  }

  // 2. Conductores / Empleados / Admins
  console.log('Seeding Persons...');

  // Hash password '1234'
  const hash = await bcrypt.hash('1234', 10);

  // Users to create
  const users = [
    // Admins
    { codigo: 'ADM-01', nombre: 'Marta', apellidos: 'Admin', email: 'marta@empresa.com', role: 'admin' },
    { codigo: 'ADM-02', nombre: 'Jose Maria', apellidos: 'Admin', email: 'josemaria@empresa.com', role: 'admin' },

    // Drivers
    { codigo: 'DRV-01', nombre: 'Juan', apellidos: 'Pérez', email: 'juan@empresa.com', role: 'driver', licencia: 'D+E' },
    { codigo: 'DRV-02', nombre: 'María', apellidos: 'López', email: 'maria@empresa.com', role: 'driver', licencia: 'D+E' },
    { codigo: 'DRV-03', nombre: 'Luis', apellidos: 'Gomez', email: 'luis@empresa.com', role: 'driver', licencia: 'D' },

    // Mechanics
    { codigo: 'MEC-01', nombre: 'Carlos', apellidos: 'Ruiz', email: 'carlos@empresa.com', role: 'mechanic' },
    { codigo: 'MEC-02', nombre: 'Ana', apellidos: 'Sánchez', email: 'ana@empresa.com', role: 'mechanic' },

    // Staff
    { codigo: 'STF-01', nombre: 'Laura', apellidos: 'García', email: 'laura@empresa.com', role: 'admin_staff' },

    // Cleaner
    { codigo: 'CLN-01', nombre: 'Pedro', apellidos: 'Ramírez', email: 'pedro@empresa.com', role: 'cleaner' }
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO conductores (codigo, nombre, apellidos, email, licencia, fecha_alta, rol, imagen, password) 
         VALUES (?, ?, ?, ?, ?, '2023-01-01', ?, ?, ?)`,
      [u.codigo, u.nombre, u.apellidos, u.email, u.licencia || null, u.role, null, hash]
    );
  }

  // 3. Clientes
  console.log('Seeding Clients...');
  await pool.query(`INSERT INTO clientes (nombre, email, password) VALUES ('Cliente Demo', 'cliente@demo.com', ?)`, [hash]);

  // 4. Rutas
  console.log('Seeding Routes...');

  const paradasMADBCN = JSON.stringify([
    { nombre: 'Madrid (Moncloa)', hora: '13:30' },
    { nombre: 'Zaragoza (Delicias)', hora: '10:30' },
    { nombre: 'Barcelona (Sants)', hora: '07:30' }
  ]);
  const paradasMADVAL = JSON.stringify([
    { nombre: 'Madrid (Sur)', hora: '09:00' },
    { nombre: 'Valencia (Estación)', hora: '13:00' }
  ]);

  await pool.query(`INSERT INTO rutas (codigo, nombre, origen, destino, distancia_km, duracion_estimada_min, activo, precio, paradas, imagen) VALUES
      ('R-MAD-BCN', 'Madrid - Barcelona', 'Madrid', 'Barcelona', 620, 360, 1, 45.50, ?, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=600'),
      ('R-MAD-VAL', 'Madrid - Valencia', 'Madrid', 'Valencia', 350, 210, 1, 32.00, ?, 'https://images.unsplash.com/photo-1552055615-565e3115793e?q=80&w=600')`,
    [paradasMADBCN, paradasMADVAL]);

  // 5. Mantenimientos (alertas dashboard)
  console.log('Seeding Maintenances...');

  // Get first bus id
  const [buses] = await pool.query('SELECT id FROM autobuses LIMIT 2');
  const bus1 = buses[0]?.id;
  const bus2 = buses[1]?.id;

  if (bus1 && bus2) {
    await pool.query(`INSERT INTO mantenimientos (autobus_id, tipo, fecha_programada, descripcion, estado) VALUES 
        (?, 'itv', '2023-12-01', 'ITV Caducada', 'pendiente'),
        (?, 'aceite', '2024-01-10', 'Cambio de aceite necesario', 'pendiente')`, [bus1, bus2]);
  }

  // 6. Viajes (Solicitudes pendientes e incidencias)
  console.log('Seeding Trips...');

  // Get first client
  const [clients] = await pool.query('SELECT id FROM clientes LIMIT 1');
  const clientId = clients[0]?.id;

  // Get first driver
  const [drivers] = await pool.query("SELECT id FROM conductores WHERE rol='driver' LIMIT 1");
  const driverId = drivers[0]?.id;

  if (clientId) {
    // Solicitud pendiente
    await pool.query(`INSERT INTO viajes_discrecionales (
          cliente_id, origen, destino, fecha_salida, fecha_llegada, plazas, 
          precio_total, estado, observaciones
        ) VALUES (
          ?, 'Madrid', 'Segovia', '2026-06-01 09:00:00', '2026-06-01 18:00:00', 40,
          450.00, 'pendiente', 'Excursión escolar'
        )`, [clientId]);

    if (bus1 && driverId) {
      // Viaje con incidencia (simulado via chat o estado)
      await pool.query(`INSERT INTO viajes_discrecionales (
              cliente_id, origen, destino, fecha_salida, fecha_llegada, plazas, 
              precio_total, estado, conductor_id, autobus_id
            ) VALUES (
              ?, 'Bilbao', 'San Sebastián', '2026-02-01 08:00:00', '2026-02-01 20:00:00', 30,
              300.00, 'aceptado', ?, ?
            )`, [clientId, driverId, bus1]);
    }
  }

  // 7. Incidencias
  console.log('Seeding Incidents...');
  // Drivers should be available from previous fetch or fetch again
  const [allDrivers] = await pool.query("SELECT id FROM conductores WHERE rol='driver'");
  if (allDrivers.length > 0) {
    const d1 = allDrivers[0].id;
    const d2 = allDrivers[1] ? allDrivers[1].id : d1;

    await pool.query(`INSERT INTO incidencias (titulo, descripcion, tipo, conductor_id, estado) VALUES 
        ('Retraso por tráfico', 'Accidente en la M-30 ha causado retraso de 30 mins', 'retraso', ?, 'abierta'),
        ('Fallo en aire acondicionado', 'El aire acondicionado no enfría correctamente', 'averia', ?, 'abierta'),
        ('Hemos tenido que parar 15 minutos', 'Pasajero mareado, parada técnica.', 'otro', ?, 'resuelta'),
        ('Rotura de luna', 'Piedra en la carretera ha roto la luna delantera', 'averia', ?, 'abierta'),
        ('Retraso llegada', 'Retraso de 45 minutos por atasco en entrada a Madrid', 'retraso', ?, 'abierta')
      `, [d1, d1, d2, d1, d2]);
  }

  console.log('Seed completed.');
}

// ... existing code ...

// Run if called directly (node seed.js)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch(console.error);
}
