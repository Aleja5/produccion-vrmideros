/**
 * Script de prueba para verificar el funcionamiento del auto-refresh
 * Este archivo puede ser importado en la consola del navegador para hacer pruebas
 */

// Función para monitorear las actualizaciones automáticas
window.testAutoRefresh = function() {
  console.log('🧪 Iniciando prueba de auto-refresh...');
  
  // Monitorear requests de red
  const originalFetch = window.fetch;
  const originalXMLHttpRequest = window.XMLHttpRequest.prototype.open;
  
  let requestCount = 0;
  const startTime = Date.now();
  
  // Interceptar fetch requests
  window.fetch = function(...args) {
    const url = args[0];
    if (url.includes('/api/')) {
      requestCount++;
      console.log(`📡 Request #${requestCount}: ${url} (${new Date().toLocaleTimeString()})`);
    }
    return originalFetch.apply(this, args);
  };
  
  // Interceptar XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (url.includes('/api/')) {
      requestCount++;
      console.log(`📡 XHR Request #${requestCount}: ${method} ${url} (${new Date().toLocaleTimeString()})`);
    }
    return originalXMLHttpRequest.apply(this, [method, url, ...args]);
  };
  
  // Mostrar estadísticas cada 30 segundos
  const interval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`📊 Estadísticas (${elapsed}s): ${requestCount} requests realizados`);
    
    // Mostrar estadísticas de caché
    if (window.CacheManager) {
      const stats = window.CacheManager.getCacheStats();
      console.log('💾 Caché:', stats);
    }
  }, 30000);
  
  // Detener monitoreo después de 10 minutos
  setTimeout(() => {
    clearInterval(interval);
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalXMLHttpRequest;
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Prueba completada. Total: ${requestCount} requests en ${totalTime} segundos`);
  }, 600000); // 10 minutos
};

// Función para probar la visibilidad de página
window.testPageVisibility = function() {
  console.log('👁️ Iniciando prueba de visibilidad de página...');
  
  document.addEventListener('visibilitychange', () => {
    const state = document.visibilityState;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔄 Página ${state} a las ${timestamp}`);
  });
  
  console.log('👁️ Monitoreo de visibilidad activado. Cambia de pestaña para probarlo.');
};

// Función para limpiar caché manualmente
window.clearAppCache = function() {
  if (window.CacheManager) {
    window.CacheManager.clearAppCache();
  } else {
    console.warn('CacheManager no disponible');
  }
};

// Función para mostrar estadísticas de caché
window.showCacheStats = function() {
  if (window.CacheManager) {
    const stats = window.CacheManager.getCacheStats();
    console.table(stats);
  } else {
    console.warn('CacheManager no disponible');
  }
};

console.log(`
🧪 Herramientas de prueba cargadas:
- testAutoRefresh(): Monitorea requests automáticos
- testPageVisibility(): Prueba cambios de visibilidad
- clearAppCache(): Limpia caché de la aplicación
- showCacheStats(): Muestra estadísticas de caché
`);
