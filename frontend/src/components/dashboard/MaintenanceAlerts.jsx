import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { AlertTriangle, Wrench, CheckCircle } from 'lucide-react';

export default function MaintenanceAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const { data } = await api.get('/mantenimientos');
                // Filter and process (same logic as legacy)
                const active = data.filter(m => m.estado !== 'realizado' && m.estado !== 'cancelado');
                const processed = active.map(m => {
                    const date = new Date(m.fecha_programada.replace(' ', 'T'));
                    const now = new Date();
                    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
                    const isOverdue = diffDays < 0;
                    const severity = isOverdue ? 'red' : (diffDays <= 7 ? 'amber' : 'green');

                    return { ...m, diffDays, severity, date };
                }).filter(a => a.severity !== 'green').sort((a, b) => a.diffDays - b.diffDays);

                setAlerts(processed);
            } catch (error) {
                console.error('Error loading maintenance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    if (loading) return <div className="p-4 text-center text-gray-500">Cargando alertas...</div>;

    if (alerts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500">No hay alertas de mantenimiento urgentes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert) => {
                const isRed = alert.severity === 'red';
                const colorClass = isRed
                    ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50'
                    : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50';
                const iconBgClass = isRed
                    ? 'bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
                const Icon = isRed ? AlertTriangle : Wrench;

                return (
                    <div key={alert.id} className={`p-4 rounded-lg border flex items-center gap-4 ${colorClass}`}>
                        <div className={`p-2 rounded-full ${iconBgClass}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">{alert.tipo} - Bus {alert.matricula || alert.autobus_id}</h4>
                            <p className="text-xs opacity-90">
                                {isRed ? `Vencido hace ${Math.abs(alert.diffDays)} días` : `Vence en ${alert.diffDays} días`} ({alert.date.toLocaleDateString()})
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
