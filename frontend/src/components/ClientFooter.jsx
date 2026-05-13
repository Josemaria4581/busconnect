import { Home, Map, Briefcase } from 'lucide-react';

export default function ClientFooter({ activeTab, onTabChange }) {
    const navItems = [
        { id: 'tickets', icon: Home, label: 'Inicio' }, // Mapped to dashboard.html/tickets
        { id: 'routes', icon: Map, label: 'Rutas' },    // Mapped to gestiondeRutas.html
        { id: 'trips', icon: Briefcase, label: 'Viajes' }, // Mapped to gestiondeViajesDiscrecionales.html
    ];

    return (
        <footer className="sticky bottom-0 z-10 border-t bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark pb-safe">
            <nav className="flex justify-around p-1 sm:p-2">
                {navItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 transition-colors ${activeTab === id
                                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                            }`}
                    >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-[10px] sm:text-xs font-bold">{label}</span>
                    </button>
                ))}
            </nav>
        </footer>
    );
}
