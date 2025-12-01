import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Check, X, Clock } from 'lucide-react';

export default function PendingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/viajes-discrecionales?estado=pendiente');
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        if (!confirm(action === 'confirmado' ? '¿Aceptar viaje?' : '¿Rechazar viaje?')) return;

        try {
            const updateData = { estado: action };
            if (action === 'rechazado') {
                const reason = prompt('Motivo del rechazo:');
                if (!reason) return;
                updateData.motivo_rechazo = reason;
            }

            await api.put(`/viajes-discrecionales/${id}`, updateData);
            fetchRequests(); // Refresh list
        } catch (error) {
            alert('Error updating trip');
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Cargando solicitudes...</div>;

    if (requests.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500">No hay solicitudes pendientes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {req.origen} <span className="text-gray-400">→</span> {req.destino}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(req.fecha_salida).toLocaleString()}
                            </span>
                            <span>{req.plazas} plazas</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">{req.cliente_nombre || 'Cliente App'}</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => handleAction(req.id, 'confirmado')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Check className="w-4 h-4" /> Aceptar
                        </button>
                        <button
                            onClick={() => handleAction(req.id, 'rechazado')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" /> Rechazar
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
