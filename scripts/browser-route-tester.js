/**
 * Script para testing manual de rutas protegidas
 * Ejecutar en el navegador (consola DevTools)
 */

class RouteProtectionTester {
    constructor() {
        this.baseUrl = window.location.origin;
        this.testResults = [];
    }

    // Simular diferentes usuarios
    setUser(role, token = 'fake-token-for-testing') {
        const userData = {
            role: role,
            id: '123',
            nombre: `Test ${role}`,
            email: `test.${role}@example.com`
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        console.log(`👤 Usuario configurado como: ${role}`);
    }

    // Limpiar datos de usuario
    clearUser() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log('🧹 Datos de usuario limpiados');
    }

    // Probar acceso a una ruta específica
    async testRoute(path, expectedAccess = true) {
        try {
            console.log(`🧪 Probando ruta: ${path}`);
            
            // Navegar a la ruta
            window.history.pushState({}, '', path);
            
            // Simular cambio de ruta (para apps SPA)
            window.dispatchEvent(new PopStateEvent('popstate'));
            
            // Esperar un poco para que React procese
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verificar si estamos en la ruta esperada o fuimos redirigidos
            const currentPath = window.location.pathname;
            const wasRedirected = currentPath !== path;
            
            const result = {
                path,
                expectedAccess,
                currentPath,
                wasRedirected,
                success: expectedAccess ? !wasRedirected : wasRedirected
            };
            
            this.testResults.push(result);
            
            if (result.success) {
                console.log(`✅ ${path}: Comportamiento correcto`);
            } else {
                console.log(`❌ ${path}: Comportamiento incorrecto`);
                console.log(`   Esperado: ${expectedAccess ? 'acceso permitido' : 'acceso denegado'}`);
                console.log(`   Actual: ${wasRedirected ? 'redirigido' : 'acceso permitido'}`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Error probando ruta ${path}:`, error);
            return { path, error: error.message, success: false };
        }
    }

    // Ejecutar suite de pruebas para admin
    async testAdminRoutes() {
        console.log('\n🔑 Probando rutas de administrador...');
        this.setUser('admin');
        
        const adminRoutes = [
            '/admin-home',
            '/admin-dashboard',
            '/admin/usuarios',
            '/admin/jornadas',
            '/admin/maquinas',
            '/admin/insumos',
            '/admin/procesos',
            '/admin/areas',
            '/admin/operarios'
        ];
        
        for (const route of adminRoutes) {
            await this.testRoute(route, true); // Admin debe tener acceso
        }
        
        // Probar rutas de producción (admin NO debería tener acceso)
        const productionRoutes = [
            '/operario-dashboard',
            '/registro-produccion',
            '/mi-jornada'
        ];
        
        for (const route of productionRoutes) {
            await this.testRoute(route, false); // Admin NO debe tener acceso
        }
    }

    // Ejecutar suite de pruebas para operario
    async testProductionRoutes() {
        console.log('\n👷 Probando rutas de operario...');
        this.setUser('production');
        
        const productionRoutes = [
            '/operario-dashboard',
            '/registro-produccion',
            '/mi-jornada',
            '/historial-jornadas'
        ];
        
        for (const route of productionRoutes) {
            await this.testRoute(route, true); // Operario debe tener acceso
        }
        
        // Probar rutas de admin (operario NO debería tener acceso)
        const adminRoutes = [
            '/admin-home',
            '/admin/usuarios',
            '/admin/operarios'
        ];
        
        for (const route of adminRoutes) {
            await this.testRoute(route, false); // Operario NO debe tener acceso
        }
    }

    // Probar sin autenticación
    async testUnauthenticatedAccess() {
        console.log('\n🚫 Probando acceso sin autenticación...');
        this.clearUser();
        
        const protectedRoutes = [
            '/admin-home',
            '/admin/usuarios',
            '/operario-dashboard',
            '/registro-produccion'
        ];
        
        for (const route of protectedRoutes) {
            await this.testRoute(route, false); // Sin auth NO debe tener acceso
        }
        
        // Probar rutas públicas
        const publicRoutes = ['/', '/login'];
        for (const route of publicRoutes) {
            await this.testRoute(route, true); // Rutas públicas deben ser accesibles
        }
    }

    // Ejecutar todas las pruebas
    async runAllTests() {
        console.log('🚀 Iniciando testing de protección de rutas...\n');
        
        this.testResults = [];
        
        await this.testAdminRoutes();
        await this.testProductionRoutes();
        await this.testUnauthenticatedAccess();
        
        this.generateReport();
    }

    // Generar reporte de resultados
    generateReport() {
        console.log('\n📊 REPORTE DE TESTING DE RUTAS');
        console.log('=' .repeat(50));
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.success).length;
        const failed = total - passed;
        
        console.log(`Total de pruebas: ${total}`);
        console.log(`✅ Exitosas: ${passed}`);
        console.log(`❌ Fallidas: ${failed}`);
        console.log(`📈 Porcentaje de éxito: ${((passed/total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n🚨 PRUEBAS FALLIDAS:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`❌ ${r.path}: ${r.error || 'Comportamiento incorrecto'}`);
                });
        }
        
        // Exportar resultados para análisis
        window.routeTestResults = this.testResults;
        console.log('\n💾 Resultados guardados en window.routeTestResults');
        
        return this.testResults;
    }

    // Verificar configuración actual del usuario
    checkCurrentUser() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('token');
        
        console.log('👤 Usuario actual:', user);
        console.log('🎫 Token:', token ? 'Presente' : 'No presente');
        
        if (user) {
            console.log(`🔑 Rol: ${user.role}`);
            console.log(`📧 Email: ${user.email}`);
        }
        
        return { user, token };
    }

    // Herramientas de debugging
    debug() {
        console.log('🔧 HERRAMIENTAS DE DEBUG:');
        console.log('tester.checkCurrentUser() - Ver usuario actual');
        console.log('tester.setUser("admin") - Configurar como admin');
        console.log('tester.setUser("production") - Configurar como operario');
        console.log('tester.clearUser() - Limpiar autenticación');
        console.log('tester.testRoute("/ruta", true/false) - Probar ruta específica');
        console.log('tester.runAllTests() - Ejecutar todas las pruebas');
    }
}

// Crear instancia global
window.routeTester = new RouteProtectionTester();

// Mostrar instrucciones
console.log('🧪 Route Protection Tester cargado!');
console.log('Usa: routeTester.debug() para ver comandos disponibles');
console.log('Usa: routeTester.runAllTests() para ejecutar todas las pruebas');

// Auto-ejecutar si se detecta que es testing automático
if (window.location.search.includes('autotest=true')) {
    setTimeout(() => {
        window.routeTester.runAllTests();
    }, 1000);
}
