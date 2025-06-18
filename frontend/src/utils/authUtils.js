/**
 * Utilidades para manejo de autenticación y tokens
 */

/**
 * Verifica si el token JWT está expirado
 * @param {string} token - El token JWT
 * @returns {boolean} - true si está expirado, false si sigue válido
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Decodificar la parte del payload (segunda parte del JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000; // Convertir a segundos
    
    // Verificar si el token ha expirado
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error al verificar token:', error);
    return true; // Si hay error, considerar expirado
  }
};

/**
 * Obtiene el tiempo restante del token en minutos
 * @param {string} token - El token JWT
 * @returns {number} - Minutos restantes (0 si expirado)
 */
export const getTokenTimeRemaining = (token) => {
  if (!token) return 0;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeRemaining = payload.exp - currentTime;
    
    return timeRemaining > 0 ? Math.floor(timeRemaining / 60) : 0;
  } catch (error) {
    console.error('Error al calcular tiempo restante:', error);
    return 0;
  }
};

/**
 * Limpia todos los datos de autenticación del localStorage
 */
export const clearAuthData = () => {  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken'); // Nuevo
  localStorage.removeItem('user');
  localStorage.removeItem('operario');
  localStorage.removeItem('idOperario');
  console.log('🧹 Datos de autenticación limpiados');
};

/**
 * Maneja la expiración del token y redirige al login
 */
export const handleTokenExpiration = () => {
  console.log('🔒 Sesión expirada. Limpiando datos...');
  clearAuthData();
  window.location.href = '/login';
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - true si está autenticado
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // Si no hay tokens, no está autenticado
  if (!token && !refreshToken) return false;
  
  // Si hay refresh token, consideramos que está autenticado
  // (el interceptor se encargará de renovar el access token)
  if (refreshToken) return true;
  
  // Si solo hay access token, verificar si está válido
  return !isTokenExpired(token);
};

/**
 * Realiza logout completo
 */
export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    // Notificar al servidor para invalidar el refresh token
    if (refreshToken) {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    // Limpiar siempre, independientemente del resultado
    clearAuthData();
    window.location.href = '/login';
  }
};

/**
 * Intenta renovar el token usando el refresh token
 * @returns {boolean} - true si se renovó exitosamente
 */
export const refreshTokenIfNeeded = async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    console.log('🚫 No hay refresh token disponible');
    return false;
  }
  
  // Si el token está próximo a expirar, renovarlo
  if (isTokenExpired(token)) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        console.log('🔄 Token renovado exitosamente');
        return true;
      } else {
        console.log('❌ Error renovando token:', response.status);
        handleTokenExpiration();
        return false;
      }
    } catch (error) {
      console.error('❌ Error renovando token:', error);
      handleTokenExpiration();
      return false;
    }
  }
  
  return true;
};

/**
 * Verifica si hay un token válido en localStorage (access o refresh)
 * @returns {boolean} - true si hay token válido, false si no
 */
export const hasValidToken = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // Si hay access token válido
  if (token && !isTokenExpired(token)) {
    return true;
  }
  
  // Si hay refresh token (asumimos que es válido hasta que falle)
  if (refreshToken) {
    return true;
  }
  
  return false;
};

/**
 * Obtiene información del usuario desde el token
 * @param {string} token - El token JWT
 * @returns {object|null} - Información del usuario o null si inválido
 */
export const getUserFromToken = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error al extraer usuario del token:', error);
    return null;
  }
};
