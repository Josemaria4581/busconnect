import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { MapPin, Flag, Send, Calendar, Clock, DollarSign, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/api';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZiNTQ4YmZhMmE1MzQyM2RhMTcyMzVlNmRhZWZmOGVmIiwiaCI6Im11cm11cjY0In0=';
const OPENCAGE_KEY = 'c0b092296bce4c1685af8af7ba387a62';

function MapUpdater({ routeCoords }) {
    const map = useMap();
    useEffect(() => {
        if (routeCoords && routeCoords.length > 0) {
            const bounds = L.latLngBounds(routeCoords.map(c => [c[1], c[0]]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [routeCoords, map]);
    return null;
}

export default function DiscretionaryTrips() {
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Map State for Selected Trip
    const [routeCoords, setRouteCoords] = useState([]);
    const [loadingMap, setLoadingMap] = useState(false);

    const [drivers, setDrivers] = useState([]);

    useEffect(() => {
        loadTrips();
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        try {
            const { data } = await api.get('/conductores');
            setDrivers(data);
        } catch (e) {
            console.error("Error loading drivers", e);
        }
    };

    const loadTrips = async () => {
        try {
            const { data } = await api.get('/viajes-discrecionales');
            setTrips(data);
        } catch (e) {
            console.error("Error loading trips", e);
        } finally {
            setLoading(false);
        }
    };

    // Chat polling
    useEffect(() => {
        let interval;
        if (selectedTrip) {
            fetchMessages();
            interval = setInterval(fetchMessages, 5000);
        }
        return () => clearInterval(interval);
    }, [selectedTrip]);

    // Scroll chat only when new messages arrive or on load
    useEffect(() => {
        // Simple check: if we are at the bottom, or close to it, scroll to invalid.
        // For now, let's just scroll on initial load or if user sending.
        // But to satisfy "scrolls automatically endlessly", we should restrict it.
        // A simple fix for "scrolls without touching" is to check if it's the first load
        // or if the new message count > old message count.
        // For simplicity here, preventing strict auto-scroll on every poll:
        if (chatMessages.length > 0) {
            // check if last message is from agent (us) -> scroll
            const lastMsg = chatMessages[chatMessages.length - 1];
            if (lastMsg.emisor === 'agent') {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [chatMessages]);

    // Map logic when trip selected
    useEffect(() => {
        if (selectedTrip && selectedTrip.origen && selectedTrip.destino) {
            updateMap(selectedTrip.origen, selectedTrip.destino);
        } else {
            setRouteCoords([]);
        }
    }, [selectedTrip]);


    const fetchMessages = async () => {
        if (!selectedTrip) return;
        try {
            const { data } = await api.get(`/viajes-discrecionales/${selectedTrip.id}/chat`);
            // Only update state if length changed to unexpected re-renders
            if (data.length !== chatMessages.length) {
                setChatMessages(data);
            }
        } catch (e) {
            console.error("Chat error", e);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedTrip) return;
        try {
            await api.post(`/viajes-discrecionales/${selectedTrip.id}/chat`, {
                emisor: 'agent', // Admin/Agent role
                mensaje: newMessage
            });
            setNewMessage('');
            fetchMessages(); // This will trigger scroll bc emisor=agent
        } catch (e) {
            alert("Error enviando mensaje");
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedTrip) return;
        if (!confirm(`¿Cambiar estado a ${newStatus}?`)) return;

        try {
            await api.put(`/viajes-discrecionales/${selectedTrip.id}`, { estado: newStatus });
            const updated = { ...selectedTrip, estado: newStatus };
            setSelectedTrip(updated);
            setTrips(trips.map(t => t.id === updated.id ? updated : t));

            // Auto-send notification message to chat? Optional.
        } catch (e) {
            alert("Error actualizando estado");
        }
    };

    const getCoordinates = async (addr) => {
        try {
            const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(addr)}&key=${OPENCAGE_KEY}&language=es`);
            const data = await res.json();
            return data.results?.[0]?.geometry;
        } catch (e) {
            return null;
        }
    };

    const updateMap = async (origen, destino) => {
        setLoadingMap(true);
        try {
            const c1 = await getCoordinates(origen);
            const c2 = await getCoordinates(destino);
            if (!c1 || !c2) return;

            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}&start=${c1.lng},${c1.lat}&end=${c2.lng},${c2.lat}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.features?.[0]) {
                setRouteCoords(data.features[0].geometry.coordinates);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMap(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Gestión de Viajes Discrecionales" />

            <main className="flex-1 p-4 flex gap-4 min-h-0">
                {/* List Column */}
                <div className="w-1/3 bg-white dark:bg-card-dark rounded-xl shadow border border-border-light dark:border-border-dark flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-border-light dark:border-border-dark flex-none">
                        <h2 className="font-bold text-lg">Solicitudes Recientes</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? <p className="p-4 text-center">Cargando...</p> : trips.map(trip => (
                            <div
                                key={trip.id}
                                onClick={() => setSelectedTrip(trip)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTrip?.id === trip.id
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-gray-50 dark:bg-slate-800 border-transparent hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm truncate w-3/4">{trip.cliente_nombre || `Cliente #${trip.cliente_id}`}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${trip.estado === 'confirmado' ? 'bg-green-100 text-green-700' :
                                        trip.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{trip.estado}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{trip.origen} → {trip.destino}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(trip.fecha_salida).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {!loading && trips.length === 0 && <p className="p-4 text-center text-gray-500">No hay solicitudes.</p>}
                    </div>
                </div>

                {/* Details Column */}
                {selectedTrip ? (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        {/* Top: Map & Info */}
                        <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
                            {/* Map */}
                            <div className="bg-white dark:bg-card-dark rounded-xl shadow border border-border-light dark:border-border-dark overflow-hidden relative h-96">
                                <MapContainer
                                    key={selectedTrip ? selectedTrip.id : 'empty'}
                                    center={[40.4168, -3.7038]}
                                    zoom={6}
                                    className="h-full w-full"
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                    {routeCoords.length > 0 && <Polyline positions={routeCoords.map(c => [c[1], c[0]])} color="#1173d4" weight={4} />}
                                    <MapUpdater routeCoords={routeCoords} />
                                </MapContainer>
                                {loadingMap && <div className="absolute inset-0 bg-white/50 z-[1000] flex items-center justify-center"><span className="text-sm font-bold bg-white px-2 py-1 rounded">Cargando Mapa...</span></div>}
                            </div>

                            {/* Info & Actions */}
                            <div className="bg-white dark:bg-card-dark rounded-xl shadow border border-border-light dark:border-border-dark p-4 flex flex-col overflow-y-auto">
                                <h3 className="font-bold text-xl mb-4 text-primary">Detalles del Viaje #{selectedTrip.id}</h3>

                                <div className="space-y-3 flex-1">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Recorrido</label>
                                        <p className="text-sm">{selectedTrip.origen}</p>
                                        <p className="text-xs text-gray-400 pl-2">↓</p>
                                        <p className="text-sm">{selectedTrip.destino}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Salida</label>
                                            <p className="text-sm">{new Date(selectedTrip.fecha_salida).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Llegada</label>
                                            <p className="text-sm">{new Date(selectedTrip.fecha_llegada).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Plazas</label>
                                            <p className="text-sm">{selectedTrip.plazas}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Precio Total</label>
                                            <p className="text-lg font-bold text-primary">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedTrip.precio_total)}</p>
                                        </div>
                                    </div>

                                    {/* Driver Assignment Section */}
                                    <div className="pt-2 border-t border-dashed space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 block">Asignar Conductor (Validación Tacógrafo)</label>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await api.post(`/viajes-discrecionales/${selectedTrip.id}/auto-assign`);
                                                        const { trip, conductor } = res.data;

                                                        // Update state
                                                        setSelectedTrip(trip);
                                                        setTrips(trips.map(t => t.id === trip.id ? trip : t));

                                                        alert(`✅ Asignado automáticamente: ${conductor.nombre} ${conductor.apellidos}`);
                                                    } catch (e) {
                                                        const msg = e.response?.data?.error || "Error en asignación automática";
                                                        alert(`❌ ${msg}`);
                                                    }
                                                }}
                                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 font-bold flex items-center gap-1"
                                            >
                                                <Clock size={12} /> Auto-Asignar (Normativa)
                                            </button>
                                        </div>
                                        <select
                                            className="w-full text-sm border rounded p-2 bg-gray-50 dark:bg-slate-800"
                                            value={selectedTrip.conductor_id || ''}
                                            onChange={async (e) => {
                                                const driverId = e.target.value;
                                                try {
                                                    await api.put(`/viajes-discrecionales/${selectedTrip.id}`, { conductor_id: driverId });
                                                    const updated = { ...selectedTrip, conductor_id: driverId };
                                                    setSelectedTrip(updated);
                                                    setTrips(trips.map(t => t.id === updated.id ? updated : t));
                                                    alert("Conductor asignado correctamente");
                                                } catch (err) {
                                                    console.error(err);
                                                    const msg = err.response?.data?.error || "Error al asignar conductor";
                                                    alert(msg); // Show the specific tachograph error
                                                }
                                            }}
                                        >
                                            <option value="">-- Sin Conductor --</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.nombre} {d.apellidos}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-t pt-4 mt-4 space-y-2">
                                    <p className="text-xs font-bold text-gray-500 mb-2">Acciones</p>
                                    <div className="flex gap-2">
                                        {selectedTrip.estado !== 'confirmado' && (
                                            <button
                                                onClick={() => handleStatusChange('confirmado')}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={16} /> Confirmar (Pagado)
                                            </button>
                                        )}
                                        {selectedTrip.estado !== 'rechazado' && (
                                            <button
                                                onClick={() => handleStatusChange('rechazado')}
                                                className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold text-sm hover:bg-red-200 flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={16} /> Rechazar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Chat */}
                        <div className="h-80 bg-white dark:bg-card-dark rounded-xl shadow border border-border-light dark:border-border-dark flex flex-col overflow-hidden">
                            <div className="p-3 bg-gray-50 dark:bg-slate-800 border-b border-border-light dark:border-border-dark flex items-center gap-2">
                                <MessageSquare size={16} className="text-primary" />
                                <h3 className="font-bold text-sm">Chat con Cliente</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100 dark:bg-slate-900/50">
                                {chatMessages.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm">No hay mensajes.</p>
                                ) : (
                                    chatMessages.map((msg, idx) => {
                                        const isAgent = msg.emisor === 'agent';
                                        return (
                                            <div key={idx} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-lg p-3 text-sm shadow-sm ${isAgent
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none'
                                                    }`}>
                                                    <p>{msg.mensaje}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isAgent ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-3 border-t border-border-light dark:border-border-dark bg-white dark:bg-card-dark">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Escribe un mensaje..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button onClick={handleSendMessage} className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-medium">Selecciona una solicitud para ver detalles</p>
                    </div>
                )}
            </main>
            <FooterNav />
        </div>
    );
}
