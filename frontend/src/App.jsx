import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword'; // Componente de recuperación
import AdminDashboard from './pages/AdminDashboard';
import ValidateCedula from './pages/ValidateCedula';
import OperarioDashboard from './pages/OperarioDashboard';
import RegistroProduccion from './components/RegistroProduccion';
import EditarProduccion from './pages/EditarProduccion';
import MiJornada from './pages/MiJornada';
import HistorialJornadas from './pages/HistorialJornadas';

import ProtectedRoute from './components/ProtectedRoute';
import MaquinasPage from './pages/Maquinas';
import InsumosPage from './pages/Insumos';
import ProcesosPage from './pages/Procesos';
import AreasPage from './pages/Areas';
import OperariosPage from './pages/Operarios';
import UsuariosPage from './pages/Usuarios';
import ResetPassword from './pages/ResetPassword';


function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ADMIN */}
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
        <Route path="/admin/insumos" element={<InsumosPage />} />
        <Route path="/admin/procesos" element={<ProcesosPage />} />
        <Route path="/admin/areas" element={<AreasPage />} />
        <Route path="/admin/operarios" element={<OperariosPage />} />
        <Route path="/admin/usuarios" element={<UsuariosPage />} />

        {/* PRODUCCIÓN */}
        {/* Ruta protegida: Validar Cédula */}
        <Route
          path="/validate-cedula"
          element={
            <ProtectedRoute allowedRoles={['admin', 'production']}>
              <ValidateCedula />
            </ProtectedRoute>
          }
        />

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
              <RegistroProduccion />
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

        {/* Nueva ruta protegida: Registrar Producción con jornadaId */}
        <Route
          path="/registro-produccion/:jornadaId"
          element={
            <ProtectedRoute allowedRoles={['production']}>
              <RegistroProduccion />
            </ProtectedRoute>
          }
        />

        <Route path="/mi-jornada" element={<MiJornada />} />
        <Route path="/historial-jornadas" element={<HistorialJornadas />} />
      </Routes>
    </Router>
  );
}

export default App;
