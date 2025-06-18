const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://tu-app-backend.onrender.com' : 'http://localhost:5000');

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para Render (puede tardar en despertar)
  headers: {
    'Content-Type': 'application/json',
  },
};

// Configuración para diferentes ambientes
export const config = {
  API_URL: API_BASE_URL,
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
};

// Helper function para construir URLs de API
export const buildApiUrl = (endpoint) => {
  // Remover slash inicial si existe
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// URLs comunes para fácil acceso
export const apiUrls = {
  // Auth
  login: buildApiUrl('api/auth/login'),
  register: buildApiUrl('api/auth/register'),
  logout: buildApiUrl('api/auth/logout'),
  resetPassword: buildApiUrl('api/auth/reset-password'),
  
  // Resources
  operarios: buildApiUrl('api/operarios'),
  maquinas: buildApiUrl('api/maquinas'),
  areas: buildApiUrl('api/areas'),
  procesos: buildApiUrl('api/procesos'),
  insumos: buildApiUrl('api/insumos'),
  produccion: buildApiUrl('api/produccion'),
  jornadas: buildApiUrl('api/jornadas'),
  usuarios: buildApiUrl('api/usuarios'),
};

export default API_BASE_URL;
