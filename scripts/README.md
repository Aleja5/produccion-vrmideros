# 🔐 Scripts de Verificación de Seguridad

Este directorio contiene scripts especializados para verificar y auditar la seguridad de la aplicación, especialmente la protección de rutas entre roles.

## 📂 Scripts Disponibles

### 1. `verify-route-protection.js` 
**Verificación estática de protección de rutas**
- Analiza el código fuente para verificar que las rutas estén correctamente protegidas
- Verifica que `ProtectedRoute` esté configurado correctamente
- Revisa middleware de backend
- Genera reporte detallado

```bash
node scripts/verify-route-protection.js
```

### 2. `browser-route-tester.js`
**Testing manual en navegador**
- Script para ejecutar en la consola del navegador
- Permite probar rutas manualmente con diferentes roles
- Incluye herramientas de debugging interactivas

```javascript
// En la consola del navegador:
// 1. Cargar el script
// 2. Usar comandos como:
routeTester.setUser('admin');
routeTester.testRoute('/admin/usuarios', true);
routeTester.runAllTests();
```

### 3. `automated-route-tests.js`
**Testing automatizado con Puppeteer**
- Pruebas completamente automatizadas
- Simula navegación real de usuarios
- Genera reportes HTML y JSON
- Requiere Puppeteer

```bash
npm run setup:puppeteer  # Instalar Puppeteer
npm run test:routes:auto # Ejecutar pruebas
```

### 4. `security-audit.js`
**Auditoría completa de seguridad**
- Verifica configuración JWT
- Revisa middleware de seguridad
- Audita dependencias
- Verifica archivos sensibles
- Genera puntuación de seguridad

```bash
npm run test:security
```

## 🚀 Comandos Rápidos

```bash
# Verificar protección de rutas (análisis estático)
npm run test:routes

# Ejecutar pruebas automatizadas completas
npm run test:routes:auto

# Auditoría de seguridad general
npm run test:security

# Ejecutar todas las verificaciones
npm run test:all

# Auditar dependencias de npm
npm run audit:dependencies
```

## 📊 Tipos de Reportes

### 📋 Reporte de Protección de Rutas
- **Archivo**: `logs/route-protection-report.json`
- **Contenido**: Análisis estático de configuración de rutas
- **Formato**: JSON con detalles de verificación

### 🧪 Reporte de Pruebas Automatizadas
- **Archivo**: `logs/automated-route-tests.json`
- **Archivo HTML**: `logs/route-tests-report.html`
- **Contenido**: Resultados de pruebas de navegación real
- **Formato**: JSON + HTML interactivo

### 🔒 Reporte de Auditoría de Seguridad
- **Archivo**: `logs/security-audit.json`
- **Contenido**: Análisis completo de seguridad
- **Incluye**: Puntuación de seguridad, vulnerabilidades, recomendaciones

## 🎯 Configuración de Rutas Esperada

### Rutas de Admin (solo `admin`)
```
/admin-home
/admin-dashboard
/admin/usuarios
/admin/jornadas
/admin/maquinas
/admin/insumos
/admin/procesos
/admin/areas
/admin/operarios
```

### Rutas de Operarios (solo `production`)
```
/operario-dashboard
/registro-produccion
/mi-jornada
/historial-jornadas
```

### Rutas Mixtas (ambos roles)
```
/validate-cedula
```

### Rutas Públicas
```
/
/login
/forgot-password
/reset-password
```

## 🔧 Configuración de Testing

### Variables de Entorno para Testing
```env
# .env.test
TEST_MODE=true
JWT_SECRET=test-secret-key-for-testing
DB_NAME=test_database
```

### Usuarios de Prueba
Los scripts incluyen usuarios de prueba predefinidos:

```javascript
const testUsers = {
    admin: {
        role: 'admin',
        email: 'admin@test.com',
        token: 'fake-admin-token'
    },
    production: {
        role: 'production', 
        email: 'operario@test.com',
        token: 'fake-production-token'
    }
};
```

## 🐛 Debugging y Troubleshooting

### Problemas Comunes

**1. Puppeteer no se instala**
```bash
# Windows
npm install puppeteer --no-sandbox

# Linux
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2
```

**2. Rutas no se detectan correctamente**
- Verificar que `ProtectedRoute` esté correctamente importado
- Verificar sintaxis de `allowedRoles` en JSX
- Revisar patrones de rutas en los scripts

**3. Tests fallan por timing**
- Aumentar timeouts en `automated-route-tests.js`
- Verificar que el servidor esté ejecutándose
- Usar `slowMo` en Puppeteer para debugging

### Logging y Debug

```javascript
// Habilitar logs detallados
DEBUG=true node scripts/verify-route-protection.js

// Ver logs en tiempo real
tail -f logs/combined.log

// Debug específico de rutas
grep "route" logs/combined.log
```

## 📈 Interpretación de Resultados

### Puntuación de Seguridad
- **90-100**: 🟢 Excelente
- **70-89**: 🟡 Bueno  
- **50-69**: 🟠 Regular
- **<50**: 🔴 Deficiente

### Códigos de Salida
- **0**: Todas las verificaciones pasaron
- **1**: Se encontraron problemas críticos
- **2**: Error durante la ejecución

## 🔄 Integración con CI/CD

```yaml
# .github/workflows/security.yml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run security tests
        run: npm run test:all
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: security-reports
          path: logs/
```

## 🛠️ Personalización

### Agregar Nuevas Rutas
Editar `routeConfig` en `verify-route-protection.js`:

```javascript
const routeConfig = {
    adminOnlyRoutes: [
        '/admin-home',
        '/nueva-ruta-admin'  // Agregar aquí
    ],
    // ...
};
```

### Customizar Verificaciones
Extender la clase `RouteProtectionVerifier`:

```javascript
class CustomVerifier extends RouteProtectionVerifier {
    verifyCustomSecurity() {
        // Lógica personalizada
    }
}
```

## 📞 Soporte

Para problemas o mejoras:
1. Revisar logs en `logs/`
2. Verificar configuración de rutas
3. Ejecutar scripts individuales para aislar problemas
4. Consultar documentación de Puppeteer si hay issues de automatización
