import axios from 'axios';

// Crear una instancia de Axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api', // URL base del backend
    timeout: 10000, // Timeout de 10 segundos
});

// Control de rate limiting
let requestCount = 0;
let resetTime = Date.now();

// Resetear contador cada minuto
setInterval(() => {
    requestCount = 0;
    resetTime = Date.now();
}, 60000);

// Agregar un interceptor para incluir el token en cada solicitud
axiosInstance.interceptors.request.use(
    (config) => {
        // Rate limiting básico: máximo 100 requests por minuto
        if (requestCount >= 100) {
            const timeToWait = 60000 - (Date.now() - resetTime);
            if (timeToWait > 0) {
                return Promise.reject(new Error(`Rate limit excedido. Espera ${Math.ceil(timeToWait/1000)} segundos.`));
            }
        }
        
        requestCount++;
        
        const token = localStorage.getItem('token');
        console.log("Token recuperado de localStorage:", token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de respuesta para manejar errores 429
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 429) {
            console.error('❌ Error 429: Demasiadas solicitudes');
            const retryAfter = error.response.headers['retry-after'] || '60';
            const message = `Demasiadas solicitudes. Intenta nuevamente en ${retryAfter} segundos.`;
            
            // Mostrar error más amigable
            throw new Error(message);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;