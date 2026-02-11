import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeSelector from '../components/ThemeSelector';
import { Bus, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            let user;
            if (isRegistering) {
                user = await register(name, email, password);
            } else {
                user = await login(email, password);
            }

            if (user.role === 'conductor' || user.role === 'driver') {
                navigate('/driver');
            } else if (user.role === 'cliente') {
                navigate('/client');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.toString());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-200">
            {/* Theme Selector Top Right */}
            <div className="absolute top-4 right-4">
                <ThemeSelector />
            </div>

            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-6">
                    <Bus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Autobuses</h2>
                    <p className="text-sm text-gray-500 font-mono">v2.1 - CACHE BUSTER</p>
                    <p className="text-gray-500 mb-6">Accede con tu correo y contraseña.</p>
                </div>

                <div className="rounded-xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-background-dark/40 backdrop-blur p-3 shadow-lg">
                    {/* Fake Tabs containing the real toggle logic now */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                        <button
                            onClick={() => setIsRegistering(false)}
                            className={`rounded-lg py-2 text-sm font-bold transition-all duration-200 ${!isRegistering ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Acceder
                        </button>
                        <button
                            onClick={() => setIsRegistering(true)}
                            className={`rounded-lg py-2 text-sm font-bold transition-all duration-200 ${isRegistering ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Crear cuenta
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {isRegistering && (
                            <div>
                                <label className="sr-only">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg placeholder-placeholder-light dark:placeholder-placeholder-dark focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark transition-colors"
                                    placeholder="Nombre completo"
                                />
                            </div>
                        )}
                        <div>
                            <label className="sr-only">Correo</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg placeholder-placeholder-light dark:placeholder-placeholder-dark focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark transition-colors"
                                placeholder="Correo"
                            />
                        </div>
                        <div>
                            <label className="sr-only">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg placeholder-placeholder-light dark:placeholder-placeholder-dark focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark transition-colors pr-10"
                                    placeholder="Contraseña"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors text-lg shadow-md hover:shadow-lg"
                        >
                            {isRegistering ? 'Crear Cuenta' : 'Acceder'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-placeholder-light dark:text-placeholder-dark mt-6">
                    © 2024 Empresa de Autobuses. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
