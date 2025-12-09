import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { Bus, Plus, Edit, Trash2, Wrench } from 'lucide-react';
import api from '../lib/api';

export default function FleetManagement() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBuses();
    }, []);

    const loadBuses = async () => {
        try {
            const { data } = await api.get('/autobuses');
            setBuses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este autobús?')) return;
        try {
            await api.delete(`/autobuses/${id}`);
            loadBuses();
        } catch (e) {
            alert('Error al eliminar: ' + e.message);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Gestión de Flota" />

            <main className="flex-1 p-4 space-y-6">
                {/* Add Button */}
                <button
                    onClick={() => window.location.href = '/fleet/new'}
                    className="w-full p-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Añadir Autobús
                </button>

                {/* Bus List */}
                <section className="space-y-3">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">Cargando...</div>
                    ) : buses.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay autobuses registrados</div>
                    ) : (
                        buses.map(bus => (
                            <div key={bus.id} className="p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                                        <Bus className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-text-light dark:text-text-dark text-lg">
                                            {bus.matricula}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {bus.modelo} • {bus.capacidad} plazas
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            {bus.kilometros_totales?.toLocaleString()} km
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${bus.estado === 'operativo'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                            }`}>
                                            {bus.estado}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => window.location.href = `/fleet/${bus.id}/maintenance`}
                                                className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                                title="Mantenimiento"
                                            >
                                                <Wrench className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/fleet/${bus.id}/edit`}
                                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bus.id)}
                                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            <FooterNav />
        </div>
    );
}
