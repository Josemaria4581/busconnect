import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSelector from '../components/ThemeSelector';
import { ChevronLeft, Edit, LogOut, Calendar, AlertTriangle, User } from 'lucide-react';

export default function DriverProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors font-display">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
                <button onClick={() => navigate(-1)} className="text-text-light dark:text-text-dark">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-text-light dark:text-text-dark">Mi Perfil</h1>
                <div className="flex items-center gap-2">
                    <ThemeSelector />
                    <div className="w-8"></div>
                </div>
            </header>

            <main className="flex-1 p-4 pb-24 overflow-y-auto">
                <div className="max-w-md mx-auto">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <img
                                alt={`Foto de perfil de ${user?.name || 'Conductor'}`}
                                className="w-24 h-24 rounded-full object-cover"
                                src={user?.avatar || "https://ui-avatars.com/api/?name=Driver&background=random"}
                            />
                        </div>
                        <h2 className="text-xl font-bold mt-4 text-text-light dark:text-text-dark">{user?.name || 'Juan Pérez'}</h2>
                        <p className="text-sm text-gray-500">Conductor</p>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white dark:bg-card-dark rounded-lg p-4 space-y-4 shadow-sm border border-border-light dark:border-border-dark">
                        <div>
                            <label className="text-xs font-medium text-gray-400">Nombre Completo</label>
                            <p className="font-semibold text-text-light dark:text-text-dark">{user?.name || 'Juan Pérez García'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400">DNI</label>
                            <p className="font-semibold text-text-light dark:text-text-dark">12345678A</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400">Licencia de Conducir</label>
                            <p className="font-semibold text-text-light dark:text-text-dark">Clase D - 12345678B</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400">Validez Licencia</label>
                            <p className="font-semibold text-text-light dark:text-text-dark">25/12/2028</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400">Teléfono</label>
                            <p className="font-semibold text-text-light dark:text-text-dark">600 123 456</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400">Email</label>
                            <p className="font-semibold text-text-light dark:text-text-dark">{user?.email || 'juan@example.com'}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-4">
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 shadow-sm transition-colors">
                            <Edit size={20} />
                            <span>Revisar y Solicitar Cambios</span>
                        </button>
                        <p className="text-xs text-center -mt-2 text-gray-400">
                            Para editar datos, serás redirigido al portal de empleado.
                        </p>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer Nav */}
            <footer className="sticky bottom-0 bg-white/90 dark:bg-card-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-safe">
                <nav className="flex justify-around">
                    <button onClick={() => navigate('/driver')} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <Calendar size={24} />
                        <span className="text-[10px] font-medium">Calendario</span>
                    </button>
                    <button onClick={() => navigate('/driver/incidents')} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <AlertTriangle size={24} />
                        <span className="text-[10px] font-medium">Incidencias</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-primary">
                        <User size={24} fill="currentColor" className="opacity-20" strokeWidth={2} />
                        <span className="text-[10px] font-bold">Perfil</span>
                    </button>
                </nav>
            </footer>
        </div>
    );
}
