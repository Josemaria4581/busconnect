/* db-seed.js - Centralized Data Seeding */
(function (global) {
    const LS_BUSES = 'flota_autobuses_v1';
    const LS_EMPL = 'empleados_v1';
    const LS_RUTAS = 'rutas_v1';
    const LS_TRIPS = 'viajes_discrecionales_v1';
    const LS_USERS = 'users_db_v1';
    const LS_INCID = 'incidencias_conductores_v1';
    const SEED_VERSION_KEY = 'db_seed_version_v1.3'; // Change to force re-seed

    // Pool de imágenes verificadas
    const busImages = [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop", // Naranja
        "https://images.unsplash.com/photo-1557223562-6c77ef16210f?q=80&w=600&auto=format&fit=crop", // Azul
        "https://images.unsplash.com/photo-1600793575654-910699b5e4d4?q=80&w=600&auto=format&fit=crop", // Amarillo
        "https://images.unsplash.com/photo-1509749837427-ac94a02d8fca?q=80&w=600&auto=format&fit=crop", // Viaje
        "https://images.unsplash.com/photo-1570125909232-eb2be3b3b2f8?q=80&w=600&auto=format&fit=crop", // Blanco
        "https://images.unsplash.com/photo-1494515744325-68b21fe966ff?q=80&w=600&auto=format&fit=crop", // Turista
        "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?q=80&w=600&auto=format&fit=crop", // Escolar
        "https://images.unsplash.com/photo-1517153192931-137b25121df4?q=80&w=600&auto=format&fit=crop", // Urbano
        "https://images.unsplash.com/photo-1525962898597-a4ae6402826e?q=80&w=600&auto=format&fit=crop", // Clásico
        "https://images.unsplash.com/photo-1568738351265-c7065f5d63dc?q=80&w=600&auto=format&fit=crop", // Viaje
        "https://images.unsplash.com/photo-1596426372332-6a7516801901?q=80&w=600&auto=format&fit=crop", // Verde
        "https://images.unsplash.com/photo-1532939163844-547f958e91b4?q=80&w=600&auto=format&fit=crop", // Escolar2
        "https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=600&auto=format&fit=crop", // Noche
        "https://images.unsplash.com/photo-1549480119-a1b7e0d3c013?q=80&w=600&auto=format&fit=crop", // Plateado
        "https://images.unsplash.com/photo-1574888365676-e41797c55c3c?q=80&w=600&auto=format&fit=crop"  // Doble piso
    ];

    const SeedDB = {
        ensure: function () {
            // Check if already seeded to avoid overwriting user data
            if (localStorage.getItem(SEED_VERSION_KEY)) return;

            console.log('Sembrando base de datos inicial...');

            this.seedBuses();
            this.seedEmployees();
            this.seedRoutes();
            this.seedTrips(); // Opcional, para tener dashboard activo
            this.seedIncidents();
            this.seedUsers();

            localStorage.setItem(SEED_VERSION_KEY, 'true');
        },

        seedUsers: function () {
            // Si ya hay usuarios, podríamos no sobrescribir, pero para demo forzamos estos 3
            // Leemos los existentes para no borrar a otros si existieran?
            // Mejor forzamos la lista base para garantizar acceso.
            const users = [
                { id: 'u-admin1', name: 'Admin Principal', email: 'admin@empresa.com', password: '1234', role: 'admin' },
                { id: 'u-admin2', name: 'Admin Secundario', email: 'admin2@empresa.com', password: '1234', role: 'admin' },
                { id: 'u-cond1', name: 'Conductor Pepe', email: 'conductor@empresa.com', password: '1234', role: 'conductor' }
            ];
            localStorage.setItem(LS_USERS, JSON.stringify(users));
        },

        seedBuses: function () {
            // Force overwrite for full demo experience on fresh start

            const buses = [];
            for (let i = 0; i < 15; i++) {
                // Solo generamos alertas de mantenimiento en los primeros 2 buses para no saturar (3-4 alertas total)
                const hasAlerts = (i < 2);
                buses.push({
                    id: `bus-${1000 + i}`,
                    plate: `${1000 + i} ${String.fromCharCode(65 + i % 26)}${String.fromCharCode(66 + i % 26)}${String.fromCharCode(67 + i % 26)}`,
                    model: ['Volvo 9700', 'Mercedes-Benz Citaro', 'Scania Irizar', 'Setra S 515', 'MAN Lion Coach'][i % 5],
                    km: Math.floor(Math.random() * 300000) + 10000,
                    seats: [55, 59, 63, 50, 70][i % 5],
                    img: busImages[i % busImages.length],
                    maintenance: hasAlerts ? [
                        // Bus 0: ITV Roja + Aceite Ambar
                        // Bus 1: Revisión Roja
                        (i === 0 ? { id: 'm-old-1', type: 'ITV', date: '2024-01-15', cost: 100, createdBy: 'system' } : null),
                        (i === 0 ? { id: 'm-old-2', type: 'Aceite', date: new Date(Date.now() - 15778800000).toISOString().split('T')[0], cost: 80, createdBy: 'system' } : null), // ~6 meses
                        (i === 1 ? { id: 'm-old-3', type: 'Revisión', date: '2023-11-20', cost: 120, createdBy: 'system' } : null)
                    ].filter(Boolean) : []
                });
            }
            localStorage.setItem(LS_BUSES, JSON.stringify(buses));
        },

        seedEmployees: function () {
            const employees = [
                { id: 'drv-1', name: 'Juan Pérez', role: 'driver', givenName: 'Juan', surname: 'Pérez' },
                { id: 'drv-2', name: 'María López', role: 'driver', givenName: 'María', surname: 'López' },
                { id: 'drv-3', name: 'Carlos Sánchez', role: 'driver', givenName: 'Carlos', surname: 'Sánchez' },
                { id: 'drv-4', name: 'Ana Vega', role: 'driver', givenName: 'Ana', surname: 'Vega' },
                { id: 'mec-1', name: 'Roberto Gómez', role: 'mechanic', givenName: 'Roberto', surname: 'Gómez' },
                { id: 'mec-2', name: 'Lucía Díaz', role: 'mechanic', givenName: 'Lucía', surname: 'Díaz' },
                { id: 'adm-1', name: 'Laura García', role: 'admin_staff', givenName: 'Laura', surname: 'García' },
                { id: 'adm-2', name: 'Pedro Martínez', role: 'admin_staff', givenName: 'Pedro', surname: 'Martínez' },
                { id: 'cln-1', name: 'Sofía Torres', role: 'cleaner', givenName: 'Sofía', surname: 'Torres' },
                { id: 'cln-2', name: 'Miguel Ruiz', role: 'cleaner', givenName: 'Miguel', surname: 'Ruiz' }
            ];
            localStorage.setItem(LS_EMPL, JSON.stringify(employees));
        },

        seedRoutes: function () {
            const rutas = [
                { id: 'rt-1', name: 'Madrid - Barcelona', origin: 'Madrid', destination: 'Barcelona', km: 620 },
                { id: 'rt-2', name: 'Madrid - Valencia', origin: 'Madrid', destination: 'Valencia', km: 350 },
                { id: 'rt-3', name: 'Sevilla - Málaga', origin: 'Sevilla', destination: 'Málaga', km: 200 }
            ];
            localStorage.setItem(LS_RUTAS, JSON.stringify(rutas));
        },

        seedTrips: function () {
            const now = new Date();
            const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);

            const trips = [
                {
                    id: 'trip-1', origen: 'Madrid', destino: 'Toledo', start: now.toISOString(), end: tomorrow.toISOString(),
                    plazas: 50, state: 'confirmado', busPlate: '1000 ABC', driverName: 'Juan Pérez', driverId: 'drv-1'
                },
                {
                    id: 'trip-2', origen: 'Madrid', destino: 'París', start: nextWeek.toISOString(), end: nextWeek.toISOString(),
                    plazas: 55, state: 'confirmado', busPlate: '1001 DEF', driverName: 'María López', driverId: 'drv-2'
                },
                {
                    id: 'trip-3', origen: 'Valencia', destino: 'Alicante', start: tomorrow.toISOString(), end: tomorrow.toISOString(),
                    plazas: 40, state: 'pendiente', createdBy: 'cliente-demo'
                },
                {
                    id: 'trip-4', origen: 'Barcelona', destino: 'Zaragoza', start: nextWeek.toISOString(), end: nextWeek.toISOString(),
                    plazas: 60, state: 'pendiente', createdBy: 'cliente-demo-2'
                }
            ];
            localStorage.setItem(LS_TRIPS, JSON.stringify(trips));
        },

        seedIncidents: function () {
            const list = [
                { id: 'inc-1', driverId: 'drv-1', driverName: 'Juan Pérez', type: 'Retraso', description: 'Tráfico denso en A-6 salida Madrid.', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'abierta' },
                { id: 'inc-2', driverId: 'drv-2', driverName: 'María López', type: 'Avería Leve', description: 'Aire acondicionado gotea un poco.', createdAt: new Date(Date.now() - 86400000).toISOString(), status: 'resuelta', resolvedBy: 'adm-1' },
                { id: 'inc-3', driverId: 'drv-3', driverName: 'Carlos Sánchez', type: 'Queja pasajero', description: 'Cliente reporta asiento sucio.', createdAt: new Date(Date.now() - 172800000).toISOString(), status: 'abierta' }
            ];
            localStorage.setItem(LS_INCID, JSON.stringify(list));
        }
    };

    global.SeedDB = SeedDB;
})(window);
