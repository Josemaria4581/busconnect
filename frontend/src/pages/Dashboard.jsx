import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import StatCard from '../components/dashboard/StatCard';
import PendingRequests from '../components/dashboard/PendingRequests';
import MaintenanceAlerts from '../components/dashboard/MaintenanceAlerts';
import { Users, Bus, Map as MapIcon, Calendar } from 'lucide-react';
import api from '../lib/api';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ buses: 0, routes: 0, activeTrips: 0 });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const { data } = await api.get('/viajes-discrecionales');
                const now = new Date();
                const active = data.filter(t => t.estado === 'confirmado' && new Date(t.fecha_salida) <= now && new Date(t.fecha_llegada) >= now).length;
                setStats(s => ({ ...s, activeTrips: active, routes: data.length }));
            } catch (e) {
                console.error(e);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Dashboard" />

            <main className="flex-1 p-4 space-y-6">
                {/* Solicitudes pendientes */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Solicitudes pendientes</h2>
                    <PendingRequests />
                </section>

                {/* Alertas de Mantenimiento */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Alertas de Mantenimiento</h2>
                    <MaintenanceAlerts />
                </section>

                {/* KPIs */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Autobuses Activos</p>
                        <p className="text-3xl font-bold text-primary">{stats.buses}</p>
                    </div>
                    <div className="flex flex-col gap-2 p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rutas en Curso</p>
                        <p className="text-3xl font-bold text-primary">{stats.activeTrips}</p>
                    </div>
                </section>
            </main>

            <FooterNav />
        </div>
    );
}
