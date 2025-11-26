import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeSelector from './ThemeSelector';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function Header({ title = "Dashboard" }) {
    const { logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const [showNotifs, setShowNotifs] = useState(false);

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8" textSize="text-sm" />
                    <h1 className="text-xl font-bold text-text-light dark:text-text-dark">{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeSelector />

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="p-2 text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                            title="Notificaciones"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {showNotifs && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-sm">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                                            <Check size={12} /> Marcar todas
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 text-sm">
                                            No tienes notificaciones
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => !n.leido && markAsRead(n.id)}
                                                className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.leido ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`text-sm ${!n.leido ? 'font-bold text-primary' : 'font-medium'}`}>{n.titulo}</h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                        {new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {n.cuerpo && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{n.cuerpo}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            {/* Backdrop for mobile closing */}
            {showNotifs && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifs(false)}></div>
            )}
        </header>
    );
}
