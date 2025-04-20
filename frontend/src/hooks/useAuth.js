import { useState, useEffect } from 'react';

const useAuth = () => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        role: null,
        operarioId: null,
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const updateAuthState = () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user')) || {};
            const operario = JSON.parse(localStorage.getItem('operario')) || {};

            setAuthState({
                isAuthenticated: !!token,
                role: user.role || null,
                operarioId: operario._id || null,
            });

        setIsLoading(false);
    };
        // Inicializar el estado de autenticación
    updateAuthState();

        // Escuchar cambios en localStorage
        window.addEventListener('storage', updateAuthState);

        // Limpiar el listener al desmontar el componente
        return () => {
            window.removeEventListener('storage', updateAuthState);
        };
    }, []);

    return { ...authState, isLoading };;
};

export default useAuth;