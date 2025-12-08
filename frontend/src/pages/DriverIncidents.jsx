import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSelector from '../components/ThemeSelector';
import { ChevronLeft, History, User as UserIcon, Bus, AlertTriangle, FileText, Calendar, Clock, MapPin, Locate, User, Calendar as CalIcon } from 'lucide-react';
import api from '../lib/api';

export default function DriverIncidents() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        conductor: '',
        viaje: '',
        tipo: '',
        descripcion: '',
        suplente: false,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ubicacion: ''
    });

    const handleSubmit = async () => {
        try {
            await api.post('/incidencias', {
                ...formData,
                conductor_id: user?.id
            });
            alert('Incidencia enviada correctamente');
            navigate('/driver');
        } catch (e) {
            alert('Error al enviar incidencia');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors font-display">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
                <button onClick={() => navigate(-1)} className="text-text-light dark:text-text-dark">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-text-light dark:text-text-dark text-center flex-1">Reporte de Incidencia</h1>
                <div className="flex items-center gap-2">
                    <ThemeSelector />
                    <button className="text-text-light dark:text-text-dark">
                        <History size={24} />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 pb-24 overflow-y-auto space-y-6">
                <div className="bg-white dark:bg-card-dark rounded-lg p-4 shadow-sm border border-border-light dark:border-border-dark space-y-4">

                    {/* Conductor */}
                    <div>
                        <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Conductor afectado</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary"
                                value={formData.conductor}
                                onChange={e => setFormData({ ...formData, conductor: e.target.value })}
                            >
                                <option value="">Seleccione conductor</option>
                                <option value={user?.id}>{user?.name} (Yo)</option>
                            </select>
                        </div>
                    </div>

                    {/* Viaje */}
                    <div>
                        <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Viaje actual</label>
                        <div className="relative">
                            <Bus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary"
                                value={formData.viaje}
                                onChange={e => setFormData({ ...formData, viaje: e.target.value })}
                            >
                                <option value="">Seleccione viaje</option>
                                <option value="1">VIAJE-DEMO-001</option>
                            </select>
                        </div>
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Tipo de incidencia</label>
                        <div className="relative">
                            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <option value="">Seleccione tipo</option>
                                <option value="mecanica">Avería Mecánica</option>
                                <option value="accidente">Accidente</option>
                                <option value="retraso">Retraso</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                    </div>

                    {/* Descripcion */}
                    <div>
                        <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Descripción</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-4 text-gray-500" size={20} />
                            <textarea
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary min-h-[120px]"
                                placeholder="Describa el problema..."
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Checkbox Suplente */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="font-medium text-text-light dark:text-text-dark">Necesita suplente</label>
                        <input
                            type="checkbox"
                            className="w-5 h-5 accent-primary"
                            checked={formData.suplente}
                            onChange={e => setFormData({ ...formData, suplente: e.target.checked })}
                        />
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input type="date" className="w-full pl-10 pr-2 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary"
                                    value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Hora</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input type="time" className="w-full pl-10 pr-2 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary"
                                    value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-base font-medium text-text-light dark:text-text-dark mb-2 block">Ubicación</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-primary"
                                placeholder="Dirección aproximada"
                                value={formData.ubicacion}
                                onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80">
                                <Locate size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="fixed bottom-[70px] left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 flex gap-4">
                    <button className="flex-1 py-3 font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                        Guardar Borrador
                    </button>
                    <button onClick={handleSubmit} className="flex-1 py-3 font-bold bg-primary text-white rounded-lg hover:bg-primary/90">
                        Enviar
                    </button>
                </div>

            </main>

            {/* Bottom Nav */}
            <footer className="sticky bottom-0 bg-white/90 dark:bg-card-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-safe z-50">
                <nav className="flex justify-around">
                    <button onClick={() => navigate('/driver')} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <CalIcon size={24} />
                        <span className="text-[10px] font-medium">Calendario</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-primary">
                        <AlertTriangle size={24} fill="currentColor" className="opacity-20" strokeWidth={2} />
                        <span className="text-[10px] font-bold">Incidencias</span>
                    </button>
                    <button onClick={() => navigate('/driver/profile')} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <User size={24} />
                        <span className="text-[10px] font-medium">Perfil</span>
                    </button>
                </nav>
            </footer>
        </div>
    );
}
