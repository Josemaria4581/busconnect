import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ClientFooter from '../components/ClientFooter';
import RequestTrip from '../components/RequestTrip';
import ClientTripDetails from '../components/ClientTripDetails';
import api from '../lib/api';
import { Map as MapIcon, Calendar, Clock, Download, XCircle, Star, Search, Filter } from 'lucide-react';

export default function ClientHome() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tickets');

    // Data States
    const [tickets, setTickets] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    // View States
    const [isRequesting, setIsRequesting] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    // Load Data based on Tab
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'tickets') {
                    if (user?.id) {
                        const { data } = await api.get(`/tickets?cliente_id=${user.id}`);
                        setTickets(data);
                    }
                } else if (activeTab === 'routes') {
                    const { data } = await api.get('/rutas');
                    setRoutes(data);
                } else if (activeTab === 'trips') {
                    if (user?.id) {
                        const { data } = await api.get(`/viajes-discrecionales?cliente_id=${user.id}`);
                        setTrips(data);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab !== 'trips') {
            setIsRequesting(false);
            setSelectedTrip(null);
        }
        loadData();
    }, [activeTab, user]);

    // Ticket Actions
    const buyTicket = async (route) => {
        if (!confirm(`¿Comprar billete para ${route.nombre} por ${route.precio}€?`)) return;

        try {
            const { data } = await api.post('/tickets', {
                cliente_id: user.id,
                ruta_id: route.id,
                precio: route.precio,
                fecha_viaje: new Date().toISOString() // Demo: immediate travel
            });
            alert('¡Billete comprado!');
            setActiveTab('tickets');
            // Refresh logic handled by useEffect when tab changes, or we can manually invoke
        } catch (e) {
            alert('Error al comprar billete: ' + e.message);
        }
    };

    const cancelTicket = async (id) => {
        if (!confirm('¿Cancelar este ticket?')) return;
        try {
            await api.delete(`/tickets/${id}`);
            setTickets(tickets.map(t => t.id === id ? { ...t, estado: 'cancelado' } : t));
        } catch (e) {
            alert('Error cancelando ticket');
        }
    };

    // Render Helpers
    const renderTicketList = () => {
        if (tickets.length === 0) return (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <p className="text-gray-500">No tienes tickets todavía.</p>
                <button onClick={() => setActiveTab('routes')} className="px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-md">
                    Comprar uno ahora
                </button>
            </div>
        );
        return (
            <div className="space-y-3">
                {tickets.map((t) => (
                    <div key={t.id} className="p-4 rounded-lg bg-white dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-2 text-primary">
                                <span className="material-symbols-outlined font-bold text-xl">#</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{t.ruta_nombre || 'Ruta'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{t.origen} → {t.destino}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Viaje: {new Date(t.fecha_viaje || t.fecha_compra).toLocaleDateString()}</p>
                                <p className="text-sm mt-1"><span className="font-semibold">Precio:</span> {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(t.precio || 0)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {t.estado === 'cancelado' ? (
                                    <span className="text-xs font-bold text-red-600">Cancelado</span>
                                ) : (
                                    <span className="text-xs font-bold text-green-600">Activo</span>
                                )}
                                <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm flex items-center gap-1">
                                    <Download size={14} />
                                </button>
                                {t.estado !== 'cancelado' && (
                                    <button onClick={() => cancelTicket(t.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1">
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderRoutesList = () => (
        <div className="space-y-4">
            {/* Mock Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold whitespace-nowrap">Todas</button>
                <button className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-sm font-medium whitespace-nowrap">Madrid</button>
                <button className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-sm font-medium whitespace-nowrap">Barcelona</button>
            </div>

            {loading ? <p>Cargando rutas...</p> : routes.map(route => (
                <div key={route.id} className="bg-white dark:bg-card-dark rounded-xl shadow-sm overflow-hidden border border-border-light dark:border-border-dark">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                        {route.imagen ? (
                            <img src={route.imagen} alt={route.nombre} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <MapIcon size={40} />
                            </div>
                        )}
                        <span className="absolute top-2 right-2 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                            {route.distancia_km} km
                        </span>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{route.nombre}</h3>
                        <p className="text-sm text-gray-500 mb-3">{route.descripcion}</p>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-primary text-lg">{route.precio}€</span>
                            <button
                                onClick={() => buyTicket(route)}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-md hover:bg-primary/90"
                            >
                                Comprar Billete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            {routes.length === 0 && !loading && <p className="text-center text-gray-500">No hay rutas disponibles.</p>}
        </div>
    );

    const renderTripsList = () => {
        if (isRequesting) {
            return (
                <RequestTrip
                    onBack={() => setIsRequesting(false)}
                    onTripCreated={() => {
                        setIsRequesting(false);
                        // Reload trips
                        if (user?.id) {
                            api.get(`/viajes-discrecionales?cliente_id=${user.id}`).then(({ data }) => setTrips(data));
                        }
                    }}
                />
            );
        }

        if (selectedTrip) {
            return (
                <ClientTripDetails
                    trip={selectedTrip}
                    onBack={() => setSelectedTrip(null)}
                />
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div>
                        <h3 className="font-bold text-primary">¿Viaje a medida?</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Solicita un autobús para tu grupo.</p>
                    </div>
                    <button
                        onClick={() => setIsRequesting(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90"
                    >
                        Solicitar
                    </button>
                </div>

                <h3 className="font-bold text-lg">Mis Solicitudes</h3>

                {loading ? <p>Cargando viajes...</p> : trips.length === 0 ? (
                    <p className="text-gray-500 text-sm">No tienes solicitudes pendientes.</p>
                ) : trips.map(trip => (
                    <div
                        key={trip.id}
                        onClick={() => setSelectedTrip(trip)}
                        className="p-4 bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                        <div className="flex justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <MapIcon size={16} /> {trip.destino}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${trip.estado === 'confirmado' ? 'bg-green-100 text-green-700' :
                                trip.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {trip.estado?.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar size={14} /> {new Date(trip.fecha_salida).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(trip.precio_total || 0)}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    // Dynamic Title
    const getTitle = () => {
        if (isRequesting) return 'Solicitar Viaje';
        if (activeTab === 'tickets') return 'Mis Tickets';
        if (activeTab === 'routes') return 'Explorar Rutas';
        if (activeTab === 'trips') return 'Viajes Discrecionales';
        return 'Cliente';
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title={getTitle()} />

            <main className="flex-1 p-4 pb-20 overflow-y-auto">
                {activeTab === 'tickets' && renderTicketList()}
                {activeTab === 'routes' && renderRoutesList()}
                {activeTab === 'trips' && renderTripsList()}
            </main>

            <ClientFooter activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
