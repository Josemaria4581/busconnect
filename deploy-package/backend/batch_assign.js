import { pool } from './db.js';


const getWeek = (d) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

async function batchAssign() {
    try {
        console.log(" Iniciando asignación masiva de viajes pendientes...");

        
        const [pendingTrips] = await pool.query("SELECT * FROM viajes_discrecionales WHERE estado = 'pendiente' ORDER BY fecha_salida ASC");

        if (pendingTrips.length === 0) {
            console.log(" No hay viajes pendientes.");
            return;
        }

        console.log(` Procesando ${pendingTrips.length} viajes...`);

        
        const [candidates] = await pool.query(
            "SELECT id, nombre, apellidos FROM conductores WHERE (rol = 'conductor' OR rol = 'driver') AND activo = 1"
        );

        const MIN_REST_MS = 9 * 60 * 60 * 1000; 
        let successCount = 0;
        let failCount = 0;

        for (const trip of pendingTrips) {
            const start = new Date(trip.fecha_salida);
            const end = new Date(trip.fecha_llegada);
            let assignedDriverId = null;

            
            for (const driver of candidates) {
                const [driversTrips] = await pool.query(
                    "SELECT * FROM viajes_discrecionales WHERE conductor_id = ? AND estado = 'confirmado' AND id != ?",
                    [driver.id, trip.id]
                );

                const newDurationH = (end - start) / 3600000;
                const startDay = start.toISOString().split('T')[0];
                const startWeek = getWeek(start);
                let dailyDriving = newDurationH;
                let weeklyDriving = newDurationH;
                let isValid = true;

                for (const t of driversTrips) {
                    const tStart = new Date(t.fecha_salida);
                    const tEnd = new Date(t.fecha_llegada);
                    const tDuration = (tEnd - tStart) / 3600000;

                    
                    if (start < tEnd && end > tStart) { isValid = false; break; }
                    
                    if (start >= tEnd && (start - tEnd) < MIN_REST_MS) { isValid = false; break; }
                    
                    if (end <= tStart && (tStart - end) < MIN_REST_MS) { isValid = false; break; }

                    
                    if (tStart.toISOString().split('T')[0] === startDay) dailyDriving += tDuration;
                    if (getWeek(tStart) === startWeek && tStart.getFullYear() === start.getFullYear()) weeklyDriving += tDuration;
                }

                if (isValid && dailyDriving <= 9 && weeklyDriving <= 56) {
                    assignedDriverId = driver.id;
                    break;
                }
            }

            if (assignedDriverId) {
                await pool.query(
                    "UPDATE viajes_discrecionales SET conductor_id = ?, estado = 'confirmado' WHERE id = ?",
                    [assignedDriverId, trip.id]
                );
                
                successCount++;
            } else {
                
                failCount++;
            }
        }

        console.log(`\n Resumen de Asignación Masiva:`);
        console.log(` Asignados y Confirmados: ${successCount}`);
        console.log(` Sin Asignar (Saturación): ${failCount}`);

    } catch (e) {
        console.error("Error batch processing:", e);
    }
}

batchAssign();
