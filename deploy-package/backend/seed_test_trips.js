import { pool } from './db.js';

async function seed() {
    try {
        console.log("Comenzando inserción de viajes de prueba...");

        // 1. Ensure a client exists
        let [clients] = await pool.query("SELECT id FROM clientes LIMIT 1");
        let clientId;
        if (clients.length === 0) {
            const [res] = await pool.query("INSERT INTO clientes (nombre, email, telefono) VALUES ('Cliente Test', 'test@cliente.com', '600000000')");
            clientId = res.insertId;
        } else {
            clientId = clients[0].id;
        }

        // 2. Loop dates
        const startDate = new Date(); // Today
        const endDate = new Date('2026-03-31');

        const origins = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'];
        const destinations = ['Toledo', 'Zaragoza', 'Alicante', 'Córdoba', 'San Sebastián'];

        let count = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            // Trip 1: Morning (08:00 - 14:00) -> 6h duration
            const start1 = new Date(d);
            start1.setHours(8, 0, 0);
            const end1 = new Date(d);
            end1.setHours(14, 0, 0);

            await pool.query(`
                INSERT INTO viajes_discrecionales 
                (cliente_id, origen, destino, fecha_salida, fecha_llegada, plazas, precio_total, estado, conductor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NULL)
            `, [
                clientId,
                origins[Math.floor(Math.random() * origins.length)],
                destinations[Math.floor(Math.random() * destinations.length)],
                start1.toISOString(),
                end1.toISOString(),
                50,
                500 + Math.random() * 200
            ]);
            count++;

            // Trip 2: Afternoon (16:00 - 20:00) -> 4h duration (Only 50% chance)
            if (Math.random() > 0.5) {
                const start2 = new Date(d);
                start2.setHours(16, 0, 0);
                const end2 = new Date(d);
                end2.setHours(20, 0, 0);

                await pool.query(`
                    INSERT INTO viajes_discrecionales 
                    (cliente_id, origen, destino, fecha_salida, fecha_llegada, plazas, precio_total, estado, conductor_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NULL)
                `, [
                    clientId,
                    destinations[Math.floor(Math.random() * destinations.length)],
                    origins[Math.floor(Math.random() * origins.length)],
                    start2.toISOString(),
                    end2.toISOString(),
                    50,
                    400 + Math.random() * 100
                ]);
                count++;
            }
        }

        console.log(`✅ Se han insertado ${count} viajes de prueba hasta el 31 de marzo.`);

    } catch (e) {
        console.error("Error seeding:", e);
    }
}

seed();
