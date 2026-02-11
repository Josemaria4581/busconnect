import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { Bus, Plus, Edit, Trash2, Wrench, X, Save, Filter } from 'lucide-react';
import api from '../lib/api';

export default function FleetManagement() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSeats, setFilterSeats] = useState('all');

    // Modals state
    const [showBusModal, setShowBusModal] = useState(false);
    const [showMaintModal, setShowMaintModal] = useState(false);
    const [selectedBus, setSelectedBus] = useState(null);

    // Form states
    const [busForm, setBusForm] = useState({
        matricula: '',
        modelo: '',
        capacidad: '',
        kilometros_totales: 0,
        estado: 'operativo',
        imagen: ''
    });

    const [maintForm, setMaintForm] = useState({
        tipo: 'itv',
        fecha_programada: '',
        descripcion: ''
    });

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

    // Filter logic
    const uniqueSeats = [...new Set(buses.map(b => b.capacidad))].sort((a, b) => a - b);
    const filteredBuses = filterSeats === 'all'
        ? buses
        : buses.filter(b => b.capacidad === parseInt(filterSeats));

    // Handlers
    const handleEdit = (bus) => {
        setSelectedBus(bus);
        setBusForm({
            matricula: bus.matricula,
            modelo: bus.modelo,
            capacidad: bus.capacidad,
            kilometros_totales: bus.kilometros_totales,
            estado: bus.estado,
            imagen: bus.imagen || ''
        });
        setShowBusModal(true);
    };

    const handleAdd = () => {
        setSelectedBus(null);
        setBusForm({
            matricula: '',
            modelo: '',
            capacidad: '',
            kilometros_totales: 0,
            estado: 'operativo',
            imagen: ''
        });
        setShowBusModal(true);
    };

    const handleMaintenance = (bus) => {
        setSelectedBus(bus);
        setMaintForm({
            tipo: 'itv',
            fecha_programada: new Date().toISOString().split('T')[0],
            descripcion: ''
        });
        setShowMaintModal(true);
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

    const saveBus = async (e) => {
        e.preventDefault();
        try {
            if (selectedBus) {
                await api.put(`/autobuses/${selectedBus.id}`, busForm);
            } else {
                await api.post('/autobuses', busForm);
            }
            setShowBusModal(false);
            loadBuses();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        }
    };

    const saveMaintenance = async (e) => {
        e.preventDefault();
        try {
            await api.post('/mantenimientos', {
                ...maintForm,
                autobus_id: selectedBus.id,
                estado: 'pendiente'
            });
            setShowMaintModal(false);
            alert('Mantenimiento programado correctamente');
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Gestión de Flota (v2.0)" />

            <main className="flex-1 p-4 space-y-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleAdd}
                        className="flex-1 p-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Añadir Autobús
                    </button>

                    <button
                        onClick={async () => {
                            if (confirm("¿ESTÁS SEGURO? Esto borrará todos los datos y restaurará los de fábrica.")) {
                                try {
                                    setLoading(true);
                                    await api.post('/api/seed');
                                    await loadBuses();
                                    alert("Base de datos regenerada.");
                                } catch (e) {
                                    alert("Error: " + e.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-500 text-white font-bold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Wrench className="w-5 h-5" />
                        Reset DB
                    </button>

                    <div className="flex items-center gap-2 bg-white dark:bg-card-dark p-2 rounded-lg border border-border-light dark:border-border-dark">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <select
                            value={filterSeats}
                            onChange={(e) => setFilterSeats(e.target.value)}
                            className="bg-transparent border-none outline-none text-text-light dark:text-text-dark min-w-[150px]"
                        >
                            <option value="all">Todas las plazas</option>
                            {uniqueSeats.map(seats => (
                                <option key={seats} value={seats}>{seats} plazas</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bus List */}
                <section className="space-y-3">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">Cargando...</div>
                    ) : filteredBuses.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay autobuses registrados</div>
                    ) : (
                        filteredBuses.map(bus => (
                            <div key={bus.id} className="p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                                        <Bus className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-text-light dark:text-text-dark text-lg">
                                                    {bus.matricula}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {bus.modelo}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                {bus.capacidad} plazas
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                            {bus.kilometros_totales?.toLocaleString()} km
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-center ${bus.estado === 'operativo'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                            }`}>
                                            {bus.estado}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleMaintenance(bus)}
                                                className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                                title="Mantenimiento"
                                            >
                                                <Wrench className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(bus)}
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

            {/* BUS MODAL */}
            {showBusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedBus ? 'Editar Autobús' : 'Nuevo Autobús'}
                            </h2>
                            <button onClick={() => setShowBusModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={saveBus} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matrícula</label>
                                <input
                                    required
                                    type="text"
                                    value={busForm.matricula}
                                    onChange={e => setBusForm({ ...busForm, matricula: e.target.value })}
                                    className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                                <input
                                    required
                                    type="text"
                                    value={busForm.modelo}
                                    onChange={e => setBusForm({ ...busForm, modelo: e.target.value })}
                                    className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacidad</label>
                                    <input
                                        required
                                        type="number"
                                        value={busForm.capacidad}
                                        onChange={e => setBusForm({ ...busForm, capacidad: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                                    <select
                                        value={busForm.estado}
                                        onChange={e => setBusForm({ ...busForm, estado: e.target.value })}
                                        className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                    >
                                        <option value="operativo">Operativo</option>
                                        <option value="taller">En Taller</option>
                                        <option value="baja">De Baja</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MAINTENANCE MODAL */}
            {showMaintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Programar Mantenimiento
                            </h2>
                            <button onClick={() => setShowMaintModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Para el autobús: <span className="font-bold">{selectedBus?.matricula}</span>
                        </p>
                        <form onSubmit={saveMaintenance} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                                <select
                                    value={maintForm.tipo}
                                    onChange={e => setMaintForm({ ...maintForm, tipo: e.target.value })}
                                    className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <option value="itv">ITV</option>
                                    <option value="revision">Revisión Periódica</option>
                                    <option value="aceite">Cambio de Aceite</option>
                                    <option value="ruedas">Cambio de Ruedas</option>
                                    <option value="averia">Reparación Avería</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Programada</label>
                                <input
                                    required
                                    type="date"
                                    value={maintForm.fecha_programada}
                                    onChange={e => setMaintForm({ ...maintForm, fecha_programada: e.target.value })}
                                    className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    value={maintForm.descripcion}
                                    onChange={e => setMaintForm({ ...maintForm, descripcion: e.target.value })}
                                    className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                                    rows="3"
                                    placeholder="Detalles adicionales..."
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Programar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <FooterNav />
        </div>
    );
}
