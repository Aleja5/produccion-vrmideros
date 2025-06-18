import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar cuando la página está visible
 * Útil para pausar actualizaciones automáticas cuando el usuario no está viendo la página
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

/**
 * Hook personalizado para auto-refresh inteligente
 * Pausa las actualizaciones cuando la página no está visible
 */
export const useAutoRefresh = (callback, interval = 5 * 60 * 1000, dependencies = []) => {
  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isVisible) {
      console.log('⏸️ Pausando auto-refresh: página no visible');
      return;
    }

    console.log('▶️ Iniciando auto-refresh cada', interval / 1000, 'segundos');
    
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refresh ejecutándose...');
        callback();
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [callback, interval, isVisible, ...dependencies]);

  return isVisible;
};
