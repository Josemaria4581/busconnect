import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { User, Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import api from '../lib/api';

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const { data } = await api.get('/conductores');
            setEmployees(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este empleado?')) return;
        try {
            await api.delete(`/conductores/${id}`);
            loadEmployees();
        } catch (e) {
            alert('Error al eliminar: ' + e.message);
        }
    };

    const getRoleBadge = (role) => {
        const roles = {
            conductor: { label: 'Conductor', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
            admin: { label: 'Admin', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
            office: { label: 'Oficina', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
        };
        const r = roles[role?.toLowerCase()] || { label: role, color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' };
        return r;
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors">
            <Header title="Gestión de Empleados" />

            <main className="flex-1 p-4 space-y-6">
                {/* Add Button */}
                <button
                    onClick={() => window.location.href = '/employees/new'}
                    className="w-full p-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Añadir Empleado
                </button>

                {/* Employee List */}
                <section className="space-y-3">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">Cargando...</div>
                    ) : employees.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay empleados registrados</div>
                    ) : (
                        employees.map(emp => {
                            const roleBadge = getRoleBadge(emp.rol);
                            return (
                                <div key={emp.id} className="p-4 rounded-lg bg-white dark:bg-card-dark shadow border border-border-light dark:border-border-dark">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-text-light dark:text-text-dark text-lg">
                                                    {emp.nombre} {emp.apellidos}
                                                </p>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadge.color}`}>
                                                    {roleBadge.label}
                                                </span>
                                            </div>
                                            <div className="space-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                {emp.email && (
                                                    <p className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4" />
                                                        {emp.email}
                                                    </p>
                                                )}
                                                {emp.telefono && (
                                                    <p className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        {emp.telefono}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => window.location.href = `/employees/${emp.id}/edit`}
                                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </main>

            <FooterNav />
        </div>
    );
}
