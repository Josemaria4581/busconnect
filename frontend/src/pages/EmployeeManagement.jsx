import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { User, Plus, Edit, Trash2, Mail, Phone, X, Save } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import AppModal, { AppToast } from '../components/ui/AppModal';
import api from '../lib/api';

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [toast, setToast] = useState({ isOpen: false, type: 'info', message: '' });

    const showToast = (message, type = 'success') => setToast({ isOpen: true, type, message });
    const [employeeForm, setEmployeeForm] = useState({
        codigo: '',
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        fecha_alta: new Date().toISOString().split('T')[0],
        licencia: '',
        rol: 'driver',
        activo: 1
    });

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

    const handleDelete = (id) => setDeleteModal({ isOpen: true, id });

    const confirmDelete = async () => {
        try {
            await api.delete(`/conductores/${deleteModal.id}`);
            setDeleteModal({ isOpen: false, id: null });
            loadEmployees();
            showToast('Empleado eliminado correctamente');
        } catch (e) {
            setDeleteModal({ isOpen: false, id: null });
            showToast('Error al eliminar: ' + e.message, 'danger');
        }
    };

    const handleAdd = () => {
        setSelectedEmployee(null);
        setEmployeeForm({
            codigo: '', nombre: '', apellidos: '', email: '', telefono: '',
            fecha_alta: new Date().toISOString().split('T')[0], licencia: '', rol: 'driver', activo: 1
        });
        setShowModal(true);
    };

    const handleEdit = (emp) => {
        setSelectedEmployee(emp);
        setEmployeeForm({
            codigo: emp.codigo || '',
            nombre: emp.nombre || '',
            apellidos: emp.apellidos || '',
            email: emp.email || '',
            telefono: emp.telefono || '',
            fecha_alta: emp.fecha_alta ? emp.fecha_alta.split('T')[0] : new Date().toISOString().split('T')[0],
            licencia: emp.licencia || '',
            rol: emp.rol || 'driver',
            activo: emp.activo !== undefined ? emp.activo : 1
        });
        setShowModal(true);
    };

    const saveEmployee = async (e) => {
        e.preventDefault();
        try {
            if (selectedEmployee) {
                await api.put(`/conductores/${selectedEmployee.id}`, employeeForm);
            } else {
                await api.post('/conductores', employeeForm);
            }
            setShowModal(false);
            loadEmployees();
            showToast(selectedEmployee ? 'Empleado actualizado' : 'Empleado creado');
        } catch (error) {
            showToast('Error: ' + (error.response?.data?.error || error.message), 'danger');
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
                <div className="flex flex-col gap-4">
                    <button onClick={handleAdd} className="w-full py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Añadir Empleado
                    </button>
                </div>

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
                                                onClick={() => handleEdit(emp)}
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={saveEmployee} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                                    <input required type="text" value={employeeForm.codigo} onChange={e => setEmployeeForm({...employeeForm, codigo: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700" placeholder="Ej: EMP-01"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                                    <select value={employeeForm.rol} onChange={e => setEmployeeForm({...employeeForm, rol: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                                        <option value="driver">Conductor</option>
                                        <option value="admin">Administrador</option>
                                        <option value="office">Oficina</option>
                                        <option value="mechanic">Mecánico</option>
                                        <option value="cleaner">Limpieza</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                    <input required type="text" value={employeeForm.nombre} onChange={e => setEmployeeForm({...employeeForm, nombre: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos</label>
                                    <input required type="text" value={employeeForm.apellidos} onChange={e => setEmployeeForm({...employeeForm, apellidos: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input type="email" value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                                    <PhoneInput
                                        country={'es'}
                                        value={employeeForm.telefono}
                                        onChange={phone => setEmployeeForm({...employeeForm, telefono: '+' + phone})}
                                        inputClass="!w-full !p-[0.5rem] !pl-12 !h-auto !rounded-lg !border !border-gray-200 dark:!bg-gray-800 dark:!border-gray-700 dark:!text-white"
                                        buttonClass="!border-gray-200 !rounded-l-lg dark:!bg-gray-800 dark:!border-gray-700"
                                        dropdownClass="dark:!bg-gray-800 dark:!text-white dark:!border-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Licencia (si es conductor)</label>
                                    <input type="text" value={employeeForm.licencia} onChange={e => setEmployeeForm({...employeeForm, licencia: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700" placeholder="Ej: D, D+E"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Alta</label>
                                    <input required type="date" value={employeeForm.fecha_alta} onChange={e => setEmployeeForm({...employeeForm, fecha_alta: e.target.value})} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 mt-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                <Save className="w-5 h-5" />
                                Guardar Empleado
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <AppModal isOpen={deleteModal.isOpen} type="danger" title="Eliminar Empleado" message="¿Eliminar este empleado? Esta acción no se puede deshacer." confirmText="Sí, Eliminar" cancelText="Cancelar" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ isOpen: false, id: null })} />
            <AppToast isOpen={toast.isOpen} type={toast.type} message={toast.message} onClose={() => setToast({...toast, isOpen: false})} />

            <FooterNav />
        </div>
    );
}
