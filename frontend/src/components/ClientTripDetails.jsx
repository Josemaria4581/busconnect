import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MapPin, Calendar, MessageSquare, Calculator, User, Download } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OPENCAGE_KEY = 'c0b092296bce4c1685af8af7ba387a62';
const ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZiNTQ4YmZhMmE1MzQyM2RhMTcyMzVlNmRhZWZmOGVmIiwiaCI6Im11cm11cjY0In0=';

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

export default function ClientTripDetails({ trip, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMap, setLoadingMap] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);
    const [distanceKm, setDistanceKm] = useState(0);
    const messagesEndRef = useRef(null);

    // Initial Load & Polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [trip.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Map Logic
    useEffect(() => {
        if (trip.origen && trip.destino) {
            updateMap();
        }
    }, [trip]);

    const getCoordinates = async (addr) => {
        try {
            const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(addr)}&key=${OPENCAGE_KEY}&language=es`);
            const data = await res.json();
            return data.results?.[0]?.geometry;
        } catch (e) {
            console.error("Geocoding error", e);
            return null;
        }
    };

    const updateMap = async () => {
        setLoadingMap(true);
        try {
            const c1 = await getCoordinates(trip.origen);
            const c2 = await getCoordinates(trip.destino);

            if (!c1 || !c2) return;

            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}&start=${c1.lng},${c1.lat}&end=${c2.lng},${c2.lat}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.features?.[0]) {
                const props = data.features[0].properties.summary;
                const coords = data.features[0].geometry.coordinates;

                setDistanceKm(props.distance / 1000);
                setRouteCoords(coords);
            }
        } catch (e) {
            console.error("Routing error", e);
        } finally {
            setLoadingMap(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data } = await api.get(`/viajes-discrecionales/${trip.id}/chat`);
            setMessages(data);
        } catch (e) {
            console.error("Error fetching messages", e);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await api.post(`/viajes-discrecionales/${trip.id}/chat`, {
                emisor: user?.nombre || 'Cliente',
                mensaje: newMessage
            });
            setNewMessage('');
            fetchMessages();
        } catch (e) {
            alert("Error al enviar mensaje");
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Detalle del Viaje", 20, 20);
        doc.setFontSize(12);
        doc.text(`Origen: ${trip.origen}`, 20, 40);
        doc.text(`Destino: ${trip.destino}`, 20, 50);
        doc.text(`Salida: ${new Date(trip.fecha_salida).toLocaleString()}`, 20, 60);
        doc.text(`Llegada: ${new Date(trip.fecha_llegada).toLocaleString()}`, 20, 70);
        doc.text(`Plazas: ${trip.plazas}`, 20, 80);
        doc.text(`Coste Total: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(trip.precio_total)}`, 20, 100);
        doc.save(`viaje_${trip.id}.pdf`);
    };

    const days = Math.ceil(Math.abs(new Date(trip.fecha_llegada) - new Date(trip.fecha_salida)) / (1000 * 60 * 60 * 24)) || 1;

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-2 text-primary font-bold hover:underline mb-2">
                <ArrowLeft size={18} /> Volver
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Route & Map */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <MapPin className="text-primary" /> Detalles de Ruta
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Origen</label>
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm font-medium">{trip.origen}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Destino</label>
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm font-medium">{trip.destino}</div>
                        </div>

                        <div className="h-64 rounded-lg overflow-hidden relative bg-gray-100 z-0">
                            <MapContainer center={[40.4168, -3.7038]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                {routeCoords.length > 0 && <Polyline positions={routeCoords.map(c => [c[1], c[0]])} color="#1173d4" weight={4} />}
                                <MapUpdater routeCoords={routeCoords} />
                            </MapContainer>
                            {loadingMap && (
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1000]">
                                    <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow">Calculando ruta...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Payment Info */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Calendar className="text-primary" /> Horarios y Estado
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${trip.estado === 'confirmado' ? 'bg-green-100 text-green-700' :
                                    trip.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {trip.estado?.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Salida</label>
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm">{new Date(trip.fecha_salida).toLocaleString()}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Llegada</label>
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm">{new Date(trip.fecha_llegada).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Plazas</label>
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm">{trip.plazas}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Días</label>
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm">{days}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Calculator className="text-primary" /> Costos
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Distancia</span>
                                <span className="font-medium">{distanceKm.toFixed(1)} km</span>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-2 pt-2 flex justify-between text-lg font-bold text-primary">
                                <span>Precio Total</span>
                                <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(trip.precio_total)}</span>
                            </div>
                        </div>

                        <button onClick={generatePDF} className="w-full py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center gap-1">
                            <Download size={16} /> Descargar PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Section - Full Width at Bottom */}
            <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex flex-col h-96">
                <div className="p-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-slate-800/50 flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" />
                    <h3 className="font-bold text-sm">Mensajes / Observaciones</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100 dark:bg-slate-900/50">
                    {/* Rejection/Observation Messages */}
                    {trip.motivo_rechazo && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-red-100 text-red-800 text-sm border border-red-200">
                                <strong>Motivo de rechazo:</strong> {trip.motivo_rechazo}
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && !trip.motivo_rechazo ? (
                        <p className="text-center text-gray-400 text-sm py-4">No hay mensajes. Escribe algo para contactar con la administración.</p>
                    ) : (
                        messages.map((msg, idx) => {
                            const isAdmin = msg.emisor === 'agent';
                            return (
                                <div key={idx} className={`flex ${!isAdmin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${!isAdmin
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                                        }`}>
                                        <p className="text-sm">{msg.mensaje}</p>
                                        <p className={`text-[10px] mt-1 text-right ${!isAdmin ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-white dark:bg-card-dark border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
