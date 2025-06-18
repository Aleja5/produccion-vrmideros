# Mejoras de Auto-Refresh y Cache Management

## 🔧 Problema Resuelto

**Problema**: Después de un tiempo, las consultas recientes no se mostraban en ConsultaJornadas y AdminDashboard.

**Causa**: Los datos se cargaban solo una vez al montar el componente y no se actualizaban automáticamente.

## ✅ Soluciones Implementadas

### 1. Auto-Refresh Inteligente

- **Auto-actualización cada 3-5 minutos** según la página
- **Pausa automática** cuando la página no está visible (ahorro de recursos)
- **Indicador visual** del último tiempo de actualización
- **Botón de actualización manual** para refrescar inmediatamente

### 2. Cache-Busting

- **Parámetro de timestamp** agregado automáticamente a todas las requests GET
- **Previene cache del navegador** que podría mostrar datos obsoletos
- **Configuración centralizada** para habilitar/deshabilitar según necesidad

### 3. Gestión de Visibilidad de Página

- **Hook personalizado `useAutoRefresh`** que detecta cuando la página está visible
- **Pausa las actualizaciones** cuando el usuario cambia de pestaña
- **Reanuda automáticamente** cuando vuelve a la página

### 4. Cache Manager Avanzado

- **Caché inteligente en localStorage** con TTL (Time To Live)
- **Limpieza automática** de cache expirado
- **Estadísticas de uso** para monitoreo
- **Utilidades de depuración**

## 📁 Archivos Modificados

### Nuevos Archivos:
- `frontend/src/hooks/useAutoRefresh.js` - Hook para auto-refresh inteligente
- `frontend/src/utils/refreshConfig.js` - Configuración centralizada de intervalos
- `frontend/src/utils/cacheManager.js` - Gestión avanzada de caché
- `frontend/src/utils/testUtils.js` - Herramientas de prueba y depuración

### Archivos Modificados:
- `frontend/src/pages/ConsultaJornadas.jsx` - Agregado auto-refresh y botón manual
- `frontend/src/pages/AdminDashboard.jsx` - Agregado auto-refresh y botón manual  
- `frontend/src/utils/axiosInstance.js` - Cache-busting automático

## ⚙️ Configuración

### Intervalos de Refresh (configurables en `refreshConfig.js`):
- **ConsultaJornadas**: 5 minutos
- **AdminDashboard**: 3 minutos (más frecuente por ser dashboard principal)
- **Dashboard KPI**: 2 minutos (datos críticos)

### Cache TTL:
- **Por defecto**: 1 hora
- **Limpieza automática**: Al detectar caché expirado

## 🧪 Herramientas de Prueba

En la consola del navegador puedes usar:

```javascript
// Monitorear requests automáticos
testAutoRefresh()

// Probar cambios de visibilidad de página
testPageVisibility()

// Limpiar caché manualmente
clearAppCache()

// Ver estadísticas de caché
showCacheStats()
```

## 🔍 Verificación de Funcionamiento

### Para verificar que funciona:

1. **Abrir ConsultaJornadas o AdminDashboard**
2. **Observar en la consola** los logs de auto-refresh cada 3-5 minutos
3. **Cambiar de pestaña** y verificar que se pausa el auto-refresh
4. **Volver a la pestaña** y verificar que se reanuda
5. **Verificar el timestamp** "Última actualización" que se actualiza automáticamente

### Logs esperados en consola:
```
🔄 Jornadas actualizadas: 25
▶️ Iniciando auto-refresh cada 300 segundos
🔄 Auto-refresh ejecutándose...
⏸️ Pausando auto-refresh: página no visible
```

## 💡 Beneficios

1. **Datos siempre actualizados** sin intervención manual
2. **Mejor experiencia de usuario** con indicadores visuales
3. **Optimización de recursos** pausando cuando no es necesario
4. **Resolución de problemas de caché** del navegador
5. **Facilidad de depuración** con herramientas integradas
6. **Configuración flexible** para diferentes tipos de datos

## 🚀 Próximas Mejoras

- Implementar **WebSockets** para actualizaciones en tiempo real
- Agregar **notificaciones** cuando hay nuevos datos
- **Sincronización inteligente** basada en la actividad del usuario
- **Caché diferencial** para actualizar solo datos que cambiaron
