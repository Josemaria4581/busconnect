import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ThemeSelector from '../components/ThemeSelector';
import { MapPin, Clock, Users, ChevronLeft, ChevronRight, Bell, Calendar as CalIcon, AlertTriangle, User } from 'lucide-react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function DriverHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [trips, setTrips] = useState([]);
    const [todaysTrips, setTodaysTrips] = useState([]);

    useEffect(() => {
        loadTrips();
    }, []);

    useEffect(() => {
        updateTodaysTrips();
    }, [selectedDate, trips]);

    const loadTrips = async () => {
        try {
            // Fetch trips associated with this driver (or all confirmed if simplified)
            const { data } = await api.get('/viajes-discrecionales');
            // Filter locally for now or backend could key off user.id if implemented
            const myTrips = data.filter(t => t.estado === 'confirmado');
            setTrips(myTrips);
        } catch (e) {
            console.error(e);
        }
    };

    const updateTodaysTrips = () => {
        const selectedStr = selectedDate.toDateString();
        const filtered = trips.filter(t => {
            const tDate = new Date(t.fecha_salida).toDateString();
            return tDate === selectedStr;
        }).sort((a, b) => new Date(a.fecha_salida) - new Date(b.fecha_salida));
        setTodaysTrips(filtered);
    };

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
        const startOffset = (firstDay + 6) % 7; // 0 = Mon

        const daysArray = [];
        for (let i = 0; i < startOffset; i++) daysArray.push(null);
        for (let i = 1; i <= days; i++) daysArray.push(new Date(year, month, i));
        return daysArray;
    };

    const days = getDaysInMonth(currentDate);

    const changeMonth = (delta) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const hasTrips = (date) => {
        if (!date) return false;
        const dStr = date.toDateString();
        return trips.some(t => new Date(t.fecha_salida).toDateString() === dStr);
    };

    const monthlyTripsCount = trips.filter(t => {
        const d = new Date(t.fecha_salida);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors font-display">
            {/* Custom Header from HTML */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
                <button onClick={() => navigate(-1)} className="text-text-light dark:text-text-dark">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-text-light dark:text-text-dark">Calendario</h1>
                <div className="flex items-center gap-2">
                    <ThemeSelector />
                    <button className="text-text-light dark:text-text-dark">
                        <Bell size={24} />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 pb-24 overflow-y-auto">
                <div className="max-w-md mx-auto">
                    {/* Month Selector */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                {monthlyTripsCount} Viajes este mes
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20">
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="text-base font-bold capitalize">
                                    {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </h2>
                                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
                            <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-sm text-center">
                            {days.map((d, i) => (
                                <div key={i} className="py-2 flex justify-center">
                                    {d ? (
                                        <button
                                            onClick={() => setSelectedDate(d)}
                                            className={`w-8 h-8 flex flex-col items-center justify-center rounded-full transition-colors relative ${d.toDateString() === selectedDate.toDateString()
                                                ? 'bg-primary text-white font-bold shadow-md'
                                                : 'text-text-light dark:text-text-dark hover:bg-primary/10'
                                                }`}
                                        >
                                            {d.getDate()}
                                            {hasTrips(d) && (
                                                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${d.toDateString() === selectedDate.toDateString() ? 'bg-white' : 'bg-primary'
                                                    }`}></span>
                                            )}
                                        </button>
                                    ) : <span />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assignments List */}
                    <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">
                        Viajes Asignados - {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </h3>

                    <div className="space-y-3">
                        {todaysTrips.length === 0 ? (
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500">
                                Sin viajes asignados este día
                            </div>
                        ) : (
                            todaysTrips.map(trip => (
                                <div key={trip.id} className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-card-dark shadow-sm border border-transparent dark:border-border-dark">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-text-light dark:text-text-dark truncate">{trip.origen} → {trip.destino}</p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {new Date(trip.fecha_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(trip.fecha_llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                                        <Clock size={14} />
                                        <span>Check-in</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Nav */}
            <footer className="sticky bottom-0 bg-white/90 dark:bg-card-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-2 pb-safe">
                <nav className="flex justify-around">
                    <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-primary">
                        <CalIcon size={24} fill="currentColor" className="opacity-20" strokeWidth={2} />
                        <span className="text-[10px] font-bold">Calendario</span>
                    </button>
                    <button onClick={() => navigate('/driver/incidents')} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary transition-colors">
                        <AlertTriangle size={24} />
                        <span className="text-[10px] font-medium">Incidencias</span>
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
