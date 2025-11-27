import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-4">Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect based on role or to unauthorized page
        if (user.role === 'conductor') return <Navigate to="/driver" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
