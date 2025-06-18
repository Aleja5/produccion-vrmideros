// Configuración centralizada para auto-refresh
// Tiempos en milisegundos

export const REFRESH_CONFIG = {
  // Configuración por página
  PAGES: {
    ADMIN_DASHBOARD: 5 * 60 * 1000, // 5 minutos
    CONSULTA_JORNADAS: 3 * 60 * 1000, // 3 minutos
    PRODUCTION_VIEW: 2 * 60 * 1000, // 2 minutos
  },
  
  // Configuración general
  DEFAULT_INTERVAL: 5 * 60 * 1000, // 5 minutos por defecto
  MIN_INTERVAL: 30 * 1000, // Mínimo 30 segundos
  MAX_INTERVAL: 15 * 60 * 1000, // Máximo 15 minutos
};
