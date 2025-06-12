// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditarProduccion from './pages/EditarProduccion';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import ConsultaJornadas from './pages/ConsultaJornadas';
import ValidateCedula from './pages/ValidateCedula';
import OperarioDashboard from './pages/OperarioDashboard';
import RegistroProduccion from './components/RegistroProduccion';

import MiJornada from './pages/MiJornada';
import HistorialJornadas from './pages/HistorialJornadas';
import AdminJornadaDetalle from './pages/AdminJornadaDetalle';

import ProtectedRoute from './components/ProtectedRoute'; // Asegúrate de que esta ruta sea correcta
import MaquinasPage from './pages/Maquinas';
import InsumosPage from './pages/Insumos';
import ProcesosPage from './pages/Procesos';
import AreasPage from './pages/Areas';
import OperariosPage from './pages/Operarios';
import UsuariosPage from './pages/Usuarios'; // Este es tu componente de página principal de usuarios
import UsuarioForm from './components/UsuarioForm'; // <--- NUEVO: Importa UsuarioForm
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';


function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* --- INICIO DE RUTAS PROTEGIDAS: ADMIN --- */}
        {/* Cada ruta envuelta individualmente */}
        <Route
          path="/admin-home"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida: Admin/Jornadas */}
        <Route
          path="/admin/jornadas"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ConsultaJornadas />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/maquinas" element={<MaquinasPage />} />
        <Route path="/admin/insumos" element={<InsumosPage />} />
        <Route path="/admin/procesos" element={<ProcesosPage />} />
        <Route path="/admin/areas" element={<AreasPage />} />
        <Route path="/admin/operarios" element={<OperariosPage />} />

        {/* Rutas de Usuarios */}
        <Route
          path="/admin/usuarios" // Ruta para la lista de usuarios (UsuariosPage)
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        {/* NUEVAS RUTAS PARA CREAR/EDITAR USUARIOS CON USUARIOFORM */}
        <Route
          path="/admin/usuarios/crear" // Ruta para crear un nuevo usuario
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsuarioForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios/editar/:id" // Ruta para editar un usuario existente
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              {/* UsuarioForm necesitará lógica para cargar el usuario inicial basado en :id */}
              <UsuarioForm />
            </ProtectedRoute>
          }
        />


        {/* Nueva ruta para el detalle de la jornada del admin */}
        <Route
          path="/admin/jornada/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminJornadaDetalle />
            </ProtectedRoute>
          }
        />
        {/* --- FIN DE RUTAS PROTEGIDAS: ADMIN --- */}

        {/* --- INICIO DE RUTAS PROTEGIDAS: PRODUCCIÓN (Operario) --- */}
        <Route
          path="/validate-cedula"
          element={
            <ProtectedRoute allowedRoles={['admin', 'production']}>
              <ValidateCedula />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operario-dashboard"
          element={
            <ProtectedRoute allowedRoles={['production']}>
              <OperarioDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registro-produccion"
          element={
            <ProtectedRoute allowedRoles={['production']}>
              <RegistroProduccion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produccion/actualizar/:id"
          element={
            <ProtectedRoute allowedRoles={['production']}>
              <EditarProduccion />
            </ProtectedRoute>
          }
        />

        <Route path="/mi-jornada" element={<MiJornada />} />
        <Route path="/historial-jornadas" element={<HistorialJornadas />} />

        {/* Rutas para manejo de contraseñas */}
        {/* Ya estaba, lo muevo aquí para agruparlo */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Ruta para capturar cualquier ruta no definida */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;