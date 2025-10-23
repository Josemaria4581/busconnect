import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DriverHome from './pages/DriverHome';
import FleetManagement from './pages/FleetManagement';
import RouteManagement from './pages/RouteManagement';
import DiscretionaryTrips from './pages/DiscretionaryTrips';
import EmployeeManagement from './pages/EmployeeManagement';
import ClientHome from './pages/ClientHome';
import DriverProfile from './pages/DriverProfile';
import DriverIncidents from './pages/DriverIncidents';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'office', 'administrador']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/fleet" element={<FleetManagement />} />
                <Route path="/routes" element={<RouteManagement />} />
                <Route path="/trips" element={<DiscretionaryTrips />} />
                <Route path="/employees" element={<EmployeeManagement />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Driver Routes */}
              <Route element={<ProtectedRoute allowedRoles={['conductor', 'driver']} />}>
                <Route path="/driver" element={<DriverHome />} />
                <Route path="/driver/profile" element={<DriverProfile />} />
                <Route path="/driver/incidents" element={<DriverIncidents />} />
              </Route>

              {/* Client Routes */}
              <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
                <Route path="/client" element={<ClientHome />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

