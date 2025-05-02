import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ValidateCedula from './pages/ValidateCedula';
import OperarioDashboard from './pages/OperarioDashboard';
import RegistroPage from './pages/RegistroProduccion';
import EditarProduccion from './pages/EditarProduccion';
import ProtectedRoute from './components/ProtectedRoute';
import MaquinasPage from './pages/Maquinas';

function App() {
    return (
        <Router>
            <Routes>
                {/* Ruta pública: Login */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Login />} />

                {/* Ruta protegida: Admin Dashboard */}
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/admin/maquinas" element={<MaquinasPage />} />

                {/* Ruta protegida: Validar Cédula */}
                <Route path="/validate-cedula" element={<ValidateCedula />} />

                {/* Ruta protegida: Operario Dashboard */}
                <Route
                    path="/operario-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['production']}>
                            <OperarioDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Ruta protegida: Registrar Producción */}
                <Route
                    path="/registro-produccion"
                    element={
                        <ProtectedRoute allowedRoles={['production']}>
                            <RegistroPage />
                        </ProtectedRoute>
                    }
                />

                {/* Ruta protegida: Editar Producción */}
                <Route
                    path="/editar-produccion/:id"
                    element={
                        <ProtectedRoute allowedRoles={['production']}>
                            <EditarProduccion />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;