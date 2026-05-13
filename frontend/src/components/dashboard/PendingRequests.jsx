import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Check, X, Clock } from 'lucide-react';
import AppModal, { AppToast } from '../ui/AppModal';

export default function PendingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ isOpen: false, type: 'info', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, action: null });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null });
    const [rejectReason, setRejectReason] = useState('');

    const showToast = (message, type = 'success') => setToast({ isOpen: true, type, message });

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

    useEffect(() => { fetchRequests(); }, []);

    const handleAction = (id, action) => {
        if (action === 'rechazado') {
            setRejectReason('');
            setRejectModal({ isOpen: true, id });
        } else {
            setConfirmModal({ isOpen: true, id, action });
        }
    };

    const executeAction = async (id, action, extra = {}) => {
        try {
            await api.put(`/viajes-discrecionales/${id}`, { estado: action, ...extra });
            fetchRequests();
            showToast(action === 'confirmado' ? 'Viaje aceptado' : 'Viaje rechazado');
        } catch (error) {
            showToast('Error al actualizar el viaje', 'danger');
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
        <>
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
                                    {(() => {
                                        try { return new Date(req.fecha_salida.replace(' ', 'T')).toLocaleString(); }
                                        catch (e) { return req.fecha_salida; }
                                    })()}
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

            {/* Confirm Accept Modal */}
            <AppModal
                isOpen={confirmModal.isOpen}
                type="success"
                title="Aceptar Viaje"
                message="¿Confirmar la aceptación de este viaje? El cliente será notificado."
                confirmText="Sí, Aceptar"
                cancelText="Cancelar"
                onConfirm={() => { setConfirmModal({ isOpen: false, id: null, action: null }); executeAction(confirmModal.id, 'confirmado'); }}
                onCancel={() => setConfirmModal({ isOpen: false, id: null, action: null })}
            />

            {/* Reject Modal with reason input */}
            <AppModal
                isOpen={rejectModal.isOpen}
                type="danger"
                title="Rechazar Viaje"
                message="Indica el motivo del rechazo para que el cliente pueda entenderlo:"
                confirmText="Rechazar Viaje"
                cancelText="Cancelar"
                onConfirm={() => {
                    setRejectModal({ isOpen: false, id: null });
                    executeAction(rejectModal.id, 'rechazado', { motivo_rechazo: rejectReason });
                }}
                onCancel={() => setRejectModal({ isOpen: false, id: null })}
            >
                <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Ej: No hay conductor disponible para esa fecha..."
                    className="w-full mt-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm resize-none h-24"
                />
            </AppModal>

            <AppToast isOpen={toast.isOpen} type={toast.type} message={toast.message} onClose={() => setToast({...toast, isOpen: false})} />
        </>
    );
}
