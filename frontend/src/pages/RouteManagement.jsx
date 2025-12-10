import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { MapPin, Plus, Edit, Trash2, Clock } from 'lucide-react';
import api from '../lib/api';

export default function RouteManagement() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        try {
            const { data } = await api.get('/rutas');
            setRoutes(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta ruta?')) return;
        try {
            await api.delete(`/rutas/${id}`);
            loadRoutes();
        } catch (e) {
            alert('Error al eliminar: ' + e.message);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Gestión de Rutas" />

            <main className="flex-1 p-4 space-y-6">
                {/* Add Button */}
                <button
                    onClick={() => window.location.href = '/routes/new'}
                    className="w-full p-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Añadir Ruta
                </button>

                {/* Route List */}
                <section className="space-y-3">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">Cargando...</div>
                    ) : routes.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay rutas registradas</div>
                    ) : (
                        routes.map(route => (
                            <div key={route.id} className="p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-text-light dark:text-text-dark text-lg">
                                            {route.origen} → {route.destino}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {route.duracion_estimada} min
                                            </span>
                                            <span>
                                                {route.distancia_km} km
                                            </span>
                                        </div>
                                        {route.descripcion && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                {route.descripcion}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => window.location.href = `/routes/${route.id}/edit`}
                                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(route.id)}
                                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
