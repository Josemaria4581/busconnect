import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { MapPin, Plus, Edit, Trash2, Clock, X, Save } from 'lucide-react';
import AppModal, { AppToast } from '../components/ui/AppModal';
import api from '../lib/api';

export default function RouteManagement() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeForm, setRouteForm] = useState({ codigo:'', nombre:'', origen:'', destino:'', distancia_km:'', duracion_estimada_min:'', precio:'', activo:1 });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [toast, setToast] = useState({ isOpen: false, type: 'info', message: '' });

    const showToast = (message, type = 'success') => setToast({ isOpen: true, type, message });

    useEffect(() => { loadRoutes(); }, []);

    const loadRoutes = async () => {
        try { const { data } = await api.get('/rutas'); setRoutes(data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = (id) => setDeleteModal({ isOpen: true, id });

    const confirmDelete = async () => {
        try {
            await api.delete(`/rutas/${deleteModal.id}`);
            setDeleteModal({ isOpen: false, id: null });
            loadRoutes();
            showToast('Ruta eliminada correctamente');
        } catch (e) {
            setDeleteModal({ isOpen: false, id: null });
            showToast('Error al eliminar: ' + e.message, 'danger');
        }
    };

    const handleAdd = () => { setSelectedRoute(null); setRouteForm({ codigo:'', nombre:'', origen:'', destino:'', distancia_km:'', duracion_estimada_min:'', precio:'', activo:1 }); setShowModal(true); };

    const handleEdit = (route) => {
        setSelectedRoute(route);
        setRouteForm({ codigo: route.codigo||'', nombre: route.nombre||'', origen: route.origen||'', destino: route.destino||'', distancia_km: route.distancia_km||'', duracion_estimada_min: route.duracion_estimada_min||'', precio: route.precio||'', activo: route.activo !== undefined ? route.activo : 1 });
        setShowModal(true);
    };

    const saveRoute = async (e) => {
        e.preventDefault();
        try {
            if (selectedRoute) { await api.put(`/rutas/${selectedRoute.id}`, routeForm); }
            else { await api.post('/rutas', routeForm); }
            setShowModal(false); loadRoutes();
            showToast(selectedRoute ? 'Ruta actualizada' : 'Ruta creada');
        } catch (error) {
            showToast('Error: ' + (error.response?.data?.error || error.message), 'danger');
        }
    };

    const inp = "w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700";

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Gestión de Rutas" />
            <main className="flex-1 p-4 space-y-6">
                <button onClick={handleAdd} className="w-full py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> + Añadir Ruta
                </button>
                <section className="space-y-3">
                    {loading ? <div className="text-center p-8 text-gray-500">Cargando...</div>
                        : routes.length === 0 ? <div className="text-center p-8 text-gray-500">No hay rutas registradas</div>
                        : routes.map(route => (
                            <div key={route.id} className="p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary"><MapPin className="w-6 h-6" /></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-text-light dark:text-text-dark text-lg">{route.origen} → {route.destino}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{route.duracion_estimada} min</span>
                                            <span>{route.distancia_km} km</span>
                                        </div>
                                        {route.descripcion && <p className="text-xs text-gray-500 mt-2">{route.descripcion}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(route)} className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(route.id)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </section>
            </main>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">{selectedRoute ? 'Editar Ruta' : 'Nueva Ruta'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={saveRoute} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label><input required type="text" value={routeForm.codigo} onChange={e=>setRouteForm({...routeForm,codigo:e.target.value})} className={inp} placeholder="R-MAD-BCN"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label><input required type="text" value={routeForm.nombre} onChange={e=>setRouteForm({...routeForm,nombre:e.target.value})} className={inp}/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origen</label><input required type="text" value={routeForm.origen} onChange={e=>setRouteForm({...routeForm,origen:e.target.value})} className={inp}/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destino</label><input required type="text" value={routeForm.destino} onChange={e=>setRouteForm({...routeForm,destino:e.target.value})} className={inp}/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distancia (km)</label><input required type="number" min="1" value={routeForm.distancia_km} onChange={e=>setRouteForm({...routeForm,distancia_km:parseInt(e.target.value)||''})} className={inp}/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (min)</label><input required type="number" min="1" value={routeForm.duracion_estimada_min} onChange={e=>setRouteForm({...routeForm,duracion_estimada_min:parseInt(e.target.value)||''})} className={inp}/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (€)</label><input required type="number" min="0" step="0.01" value={routeForm.precio} onChange={e=>setRouteForm({...routeForm,precio:parseFloat(e.target.value)||''})} className={inp}/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label><select value={routeForm.activo} onChange={e=>setRouteForm({...routeForm,activo:parseInt(e.target.value)})} className={inp}><option value={1}>Activo</option><option value={0}>Inactivo</option></select></div>
                            </div>
                            <button type="submit" className="w-full py-3 mt-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"><Save className="w-5 h-5" />Guardar Ruta</button>
                        </form>
                    </div>
                </div>
            )}

            <AppModal isOpen={deleteModal.isOpen} type="danger" title="Eliminar Ruta" message="¿Eliminar esta ruta? Esta acción no se puede deshacer." confirmText="Sí, Eliminar" cancelText="Cancelar" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ isOpen: false, id: null })} />
            <AppToast isOpen={toast.isOpen} type={toast.type} message={toast.message} onClose={() => setToast({...toast, isOpen: false})} />
            <FooterNav />
        </div>
    );
}
