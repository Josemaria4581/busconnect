import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, MapPin, Calendar, Users, Calculator, Download, Send } from 'lucide-react';
import api from '../lib/api';
import { jsPDF } from 'jspdf';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// API Constants (from legacy code)
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

export default function RequestTrip({ onBack, onTripCreated }) {
    // Form State
    const [origin, setOrigin] = useState('Plaza de España, Madrid');
    const [destination, setDestination] = useState('Aeropuerto de Barajas, Madrid');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [seats, setSeats] = useState(55);
    const [days, setDays] = useState(1);

    // Logic State
    const [loadingMap, setLoadingMap] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);
    const [distanceKm, setDistanceKm] = useState(0);
    const [durationSec, setDurationSec] = useState(0);
    const [cost, setCost] = useState({ total: 0, advance: 0, remaining: 0, perKm: 0 });

    // Constants
    const DEFAULT_SPEED = 70;
    const DRIVER_COST_EXTRA = 180;
    const OVERNIGHT_COST = 120;

    // --- Logic ---

    useEffect(() => {
        if (dateStart && dateEnd) {
            const s = new Date(dateStart);
            const l = new Date(dateEnd);
            if (!isNaN(s) && !isNaN(l)) {
                const diff = l - s;
                const d = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                setDays(d);
            }
        }
    }, [dateStart, dateEnd]);

    useEffect(() => {
        calculateCost();
    }, [distanceKm, seats, days]);

    useEffect(() => {
        // Debounce map update
        const timer = setTimeout(() => {
            if (origin && destination) updateMap();
        }, 1000);
        return () => clearTimeout(timer);
    }, [origin, destination]);

    const calculateCost = () => {
        const porKm = distanceKm * 2;
        const porPlaza = seats * 1.2;
        const porDiaExtra = Math.max(days - 1, 0) * 50;

        // Simplified Logic: Tacograph warnings shown instead of complex modals for now
        // Assuming standard single driver unless extreme
        // Legacy: extraSecondDriver, extraOvernight logic existed.
        // We will stick to basic estimate for V1 React port.

        const total = porKm + porPlaza + porDiaExtra;
        const advance = total * 0.20;

        setCost({
            perKm: porKm,
            total: total,
            advance: advance,
            remaining: total - advance
        });
    };

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
            const c1 = await getCoordinates(origin);
            const c2 = await getCoordinates(destination);

            if (!c1 || !c2) return;

            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}&start=${c1.lng},${c1.lat}&end=${c2.lng},${c2.lat}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.features?.[0]) {
                const props = data.features[0].properties.summary;
                const coords = data.features[0].geometry.coordinates;

                setDistanceKm(props.distance / 1000);
                setDurationSec(props.duration);
                setRouteCoords(coords);
            }
        } catch (e) {
            console.error("Routing error", e);
        } finally {
            setLoadingMap(false);
        }
    };

    const { user } = useAuth();
    const { addNotification } = useNotifications(); // Destructured addNotification

    const handleGenerate = async () => {
        if (!dateStart || !dateEnd) return alert("Por favor selecciona fechas");

        if (new Date(dateEnd) < new Date(dateStart)) {
            return alert("La fecha de llegada no puede ser anterior a la de salida.");
        }

        try {
            const tripData = {
                cliente_id: user?.id,
                origen: origin,
                destino: destination,
                fecha_salida: new Date(dateStart).toISOString(),
                fecha_llegada: new Date(dateEnd).toISOString(),
                plazas: seats,
                precio_total: cost.total,
                estado: 'pendiente',
                observaciones: `Días: ${days}`
            };

            await api.post('/viajes-discrecionales', tripData);

            // Notification Trigger
            addNotification(
                'Solicitud Enviada',
                `Tu solicitud de viaje a ${destination} ha sido recibida correctamente.`,
                'success'
            );

            alert('Solicitud enviada con éxito');
            onTripCreated && onTripCreated();
        } catch (e) {
            alert('Error al enviar solicitud: ' + (e.response?.data?.error || e.message));
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Solicitud de Viaje", 20, 20);
        doc.setFontSize(12);
        doc.text(`Origen: ${origin}`, 20, 40);
        doc.text(`Destino: ${destination}`, 20, 50);
        doc.text(`Salida: ${dateStart.replace('T', ' ')}`, 20, 60);
        doc.text(`Llegada: ${dateEnd.replace('T', ' ')}`, 20, 70);
        doc.text(`Plazas: ${seats}`, 20, 80);
        doc.text(`Coste Estimado: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cost.total)}`, 20, 100);
        doc.save('solicitud_viaje.pdf');
    };

    const fmtEUR = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-2 text-primary font-bold hover:underline mb-2">
                <ArrowLeft size={18} /> Volver
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Form and Map */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <MapPin className="text-primary" /> Ruta
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Origen</label>
                            <input value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Destino</label>
                            <input value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark" />
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

                {/* Details and Payment */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Calendar className="text-primary" /> Detalles
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Salida</label>
                                <input type="datetime-local" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Llegada</label>
                                <input
                                    type="datetime-local"
                                    value={dateEnd}
                                    min={dateStart}
                                    onChange={e => setDateEnd(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Plazas</label>
                                <input type="number" value={seats} onChange={e => setSeats(Number(e.target.value))} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Días</label>
                                <input type="number" readOnly value={days} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-500 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Calculator className="text-primary" /> Presupuesto
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Distancia</span>
                                <span className="font-medium">{distanceKm.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Coste por Km</span>
                                <span className="font-medium">{fmtEUR(cost.perKm)}</span>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-2 pt-2 flex justify-between text-lg font-bold text-primary">
                                <span>Total Estimado</span>
                                <span>{fmtEUR(cost.total)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Adelanto (20%)</span>
                                <span>{fmtEUR(cost.advance)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={generatePDF} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center gap-1">
                                <Download size={16} /> PDF
                            </button>
                            <button onClick={handleGenerate} className="flex-[2] py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 flex items-center justify-center gap-1">
                                <Send size={16} /> Enviar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
