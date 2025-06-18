import axios from 'axios';

// Crear una instancia de Axios simplificada para debugging
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor simple para logging
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('🚀 Request:', config.method?.toUpperCase(), config.url, config.data);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        console.log('✅ Response:', response.status, response.data);
        return response;
    },
    (error) => {
        console.error('❌ Response Error:', error.response?.status, error.response?.data, error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;
