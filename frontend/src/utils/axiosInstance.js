import axios from 'axios';

// Crear una instancia de Axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api', // URL base del backend
});

// Agregar un interceptor para incluir el token en cada solicitud
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Obtener el token del localStorage
        console.log("Token recuperado de localStorage:", token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Agregar el token al encabezado
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;