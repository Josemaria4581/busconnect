import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ClientFooter from '../components/ClientFooter';
import RequestTrip from '../components/RequestTrip';
import ClientTripDetails from '../components/ClientTripDetails';
import api from '../lib/api';
import jsPDF from 'jspdf';
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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'info' });

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
    const handleBuyTicketClick = (route) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Compra',
            message: `¿Comprar un billete para la ruta ${route.nombre} por ${route.precio}€?`,
            type: 'success',
            onConfirm: () => executeBuyTicket(route)
        });
    };

    const executeBuyTicket = async (route) => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
            await api.post('/tickets', {
                cliente_id: user.id,
                ruta_id: route.id,
                precio: route.precio,
                fecha_viaje: new Date().toISOString()
            });
            setActiveTab('tickets');
        } catch (e) {
            console.error('Error al comprar billete: ' + e.message);
        }
    };

    const handleCancelTicketClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Cancelar Billete',
            message: '¿Estás seguro de que deseas cancelar este billete? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => executeCancelTicket(id)
        });
    };

    const executeCancelTicket = async (id) => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
            await api.delete(`/tickets/${id}`);
            setTickets(tickets.map(t => t.id === id ? { ...t, estado: 'cancelado' } : t));
        } catch (e) {
            console.error('Error cancelando ticket');
        }
    };

    const downloadTicket = (t) => {
        const doc = new jsPDF();
        
        doc.setFillColor(30, 64, 175); // Blue primary
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("BusConnect - Billete de Viaje", 20, 25);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text(`Ruta: ${t.ruta_nombre || 'Desconocida'}`, 20, 60);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Origen: ${t.origen || ''}`, 20, 75);
        doc.text(`Destino: ${t.destino || ''}`, 20, 85);
        doc.text(`Pasajero: ${user?.name || 'Cliente'}`, 20, 95);
        doc.text(`Fecha del viaje: ${new Date(t.fecha_viaje || t.fecha_compra).toLocaleDateString()}`, 20, 105);
        
        doc.setFont("helvetica", "bold");
        doc.text(`PRECIO TOTAL: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(t.precio || 0)}`, 20, 125);
        
        doc.setLineWidth(0.5);
        doc.line(20, 135, 190, 135);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Referencia del Billete: #${t.id} - ${t.estado.toUpperCase()}`, 20, 145);
        doc.text("Por favor, presente este billete al conductor al subir al autobus.", 20, 152);
        
        const fileName = t.ruta_nombre ? t.ruta_nombre.replace(/\s+/g, '_') : 'Billete';
        doc.save(`Billete_${fileName}.pdf`);
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
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 rounded-lg bg-white dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-2 text-primary">
                                <span className="material-symbols-outlined font-bold text-xl">#</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{ticket.ruta_nombre || 'Ruta'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{ticket.origen} → {ticket.destino}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Viaje: {new Date(ticket.fecha_viaje || ticket.fecha_compra).toLocaleDateString()}</p>
                                <p className="text-sm mt-1"><span className="font-semibold">Precio:</span> {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(ticket.precio || 0)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {ticket.estado === 'cancelado' ? (
                                    <span className="text-xs font-bold text-red-600">Cancelado</span>
                                ) : (
                                    <span className="text-xs font-bold text-green-600">Activo</span>
                                )}
                                <button onClick={() => downloadTicket(ticket)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors rounded-lg text-sm flex items-center gap-1">
                                    <Download size={14} />
                                </button>
                                {ticket.estado !== 'cancelado' && (
                                    <button onClick={() => handleCancelTicketClick(ticket.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-lg text-sm flex items-center gap-1">
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
                <div key={route.id} className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">
                                <MapIcon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{route.nombre}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{route.origen} → {route.destino}</p>
                            </div>
                        </div>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                            {route.distancia_km} km
                        </span>
                    </div>
                    {route.descripcion && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{route.descripcion}</p>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Precio</span>
                            <span className="font-bold text-primary text-xl">{route.precio}€</span>
                        </div>
                        <button
                            onClick={() => handleBuyTicketClick(route)}
                            className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                        >
                            Comprar Billete
                        </button>
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

            {/* Custom Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                        <h2 className={`text-xl font-bold mb-2 ${confirmModal.type === 'danger' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                            {confirmModal.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                            {confirmModal.message}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="px-4 py-2 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className={`px-4 py-2 rounded-lg font-bold text-white transition-colors ${
                                    confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
                                }`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
