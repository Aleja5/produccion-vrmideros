import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { debugLog } from '../utils/log';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, role, operarioId, isLoading } = useAuth();
    const currentPath = window.location.pathname;

    if (isLoading) {
        debugLog("ProtectedRoute - Cargando datos de autenticación...");
        return <div>Cargando...</div>; // Evita redirigir mientras se carga
    }

    // Usar localStorage directamente en caso de que el estado no esté actualizado aún
    const storedToken = localStorage.getItem('token');
    const storedOperario = localStorage.getItem('operario');
    const operarioData = storedOperario ? JSON.parse(storedOperario) : null;

    const finalOperarioId = operarioId || operarioData?._id;

    if (role === 'admin') {
        debugLog("Usuario con rol admin, permitiendo acceso al dashboard de administrador.");
        return children;
    }

    if (!finalOperarioId && currentPath !== '/validate-cedula') {
        debugLog("Redirigiendo a validación de cédula. No se encontró el operario.");
        return <Navigate to="/validate-cedula" />;
    }

    if (!storedToken) {
        debugLog("Redirigiendo al login por falta de token.");
        return <Navigate to="/" />;
    }

    debugLog("Comparando role:", role, "con allowedRoles:", allowedRoles.join(","));
    debugLog("Resultado de includes:", allowedRoles.includes(role));

    if (allowedRoles && !allowedRoles.includes(String(role).trim())) {
        debugLog("Redirigiendo al login por rol no autorizado.");
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;