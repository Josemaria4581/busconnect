import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Calendar, Bus, Users } from 'lucide-react';

export default function FooterNav() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Inicio' },
        { path: '/routes', icon: Map, label: 'Rutas' },
        { path: '/trips', icon: Calendar, label: 'Viajes' },
        { path: '/fleet', icon: Bus, label: 'Flota' },
        { path: '/employees', icon: Users, label: 'Empleados' },
    ];

    return (
        <footer className="sticky bottom-0 z-10 border-t bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark">
            <nav className="flex justify-around p-2">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-lg transition-colors ${isActive(path)
                                ? 'text-primary'
                                : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                            }`}
                    >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{label}</span>
                    </Link>
                ))}
            </nav>
            <div className="text-center pb-2">
                <a href="/db-viewer" className="text-[10px] text-primary/50 hover:text-primary uppercase tracking-widest font-bold">
                    Ver Base de Datos
                </a>
            </div>
        </footer>
    );
}
