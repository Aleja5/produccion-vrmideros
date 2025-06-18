/**
 * Script para generar pruebas automatizadas con Puppeteer
 * Ejecutar con: npm run test:routes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AutomatedRouteTests {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'http://localhost:3000';
        
        // Usuarios de prueba
        this.testUsers = {
            admin: {
                role: 'admin',
                email: 'admin@test.com',
                password: 'admin123',
                token: 'fake-admin-token'
            },
            production: {
                role: 'production',
                email: 'operario@test.com',
                password: 'operario123',
                token: 'fake-production-token'
            }
        };
        
        // Configuración de rutas a probar
        this.routeTests = [
            // Rutas de admin - solo admin debe acceder
            { path: '/admin-home', allowedRoles: ['admin'] },
            { path: '/admin-dashboard', allowedRoles: ['admin'] },
            { path: '/admin/usuarios', allowedRoles: ['admin'] },
            { path: '/admin/jornadas', allowedRoles: ['admin'] },
            { path: '/admin/maquinas', allowedRoles: ['admin'] },
            { path: '/admin/insumos', allowedRoles: ['admin'] },
            { path: '/admin/procesos', allowedRoles: ['admin'] },
            { path: '/admin/areas', allowedRoles: ['admin'] },
            { path: '/admin/operarios', allowedRoles: ['admin'] },
            
            // Rutas de producción - solo operarios deben acceder
            { path: '/operario-dashboard', allowedRoles: ['production'] },
            { path: '/registro-produccion', allowedRoles: ['production'] },
            { path: '/mi-jornada', allowedRoles: ['production'] },
            { path: '/historial-jornadas', allowedRoles: ['production'] },
            
            // Rutas mixtas - ambos roles pueden acceder
            { path: '/validate-cedula', allowedRoles: ['admin', 'production'] },
            
            // Rutas públicas - cualquiera puede acceder
            { path: '/', allowedRoles: ['public'] },
            { path: '/login', allowedRoles: ['public'] }
        ];
    }

    async init() {
        console.log('🚀 Iniciando Puppeteer...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Cambiar a true para modo headless
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Configurar viewport
        await this.page.setViewport({ width: 1280, height: 800 });
        
        // Configurar user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('✅ Puppeteer iniciado correctamente');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Puppeteer cerrado');
        }
    }

    // Configurar usuario en localStorage
    async setUser(userType) {
        const user = this.testUsers[userType];
        if (!user) {
            throw new Error(`Usuario ${userType} no encontrado`);
        }
        
        await this.page.evaluateOnNewDocument((userData) => {
            localStorage.setItem('user', JSON.stringify({
                id: '123',
                role: userData.role,
                email: userData.email,
                nombre: `Test ${userData.role}`
            }));
            localStorage.setItem('token', userData.token);
        }, user);
        
        console.log(`👤 Usuario configurado: ${user.role}`);
    }

    // Limpiar autenticación
    async clearAuth() {
        await this.page.evaluateOnNewDocument(() => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        });
        
        console.log('🚫 Autenticación limpiada');
    }

    // Probar una ruta específica
    async testRoute(routeConfig, userRole) {
        const { path, allowedRoles } = routeConfig;
        const shouldHaveAccess = allowedRoles.includes(userRole) || allowedRoles.includes('public');
        
        try {
            console.log(`🧪 Probando ${path} como ${userRole}...`);
            
            // Navegar a la ruta
            const response = await this.page.goto(`${this.baseUrl}${path}`, {
                waitUntil: 'networkidle0',
                timeout: 10000
            });
            
            // Esperar un poco para que React procese
            await this.page.waitForTimeout(1000);
            
            // Obtener URL actual
            const currentUrl = this.page.url();
            const currentPath = new URL(currentUrl).pathname;
            
            // Verificar si fue redirigido
            const wasRedirected = currentPath !== path;
            const redirectedToLogin = currentPath === '/' || currentPath === '/login';
            
            // Verificar si hay elementos de error o acceso denegado
            const hasErrorMessage = await this.page.$('.error, .unauthorized, .access-denied') !== null;
            
            // Determinar si el acceso fue exitoso
            const hasAccess = !wasRedirected && !hasErrorMessage && response.status() < 400;
            
            // Verificar si el comportamiento es correcto
            const isCorrectBehavior = shouldHaveAccess ? hasAccess : !hasAccess;
            
            const result = {
                path,
                userRole,
                shouldHaveAccess,
                hasAccess,
                wasRedirected,
                redirectedToLogin,
                currentPath,
                responseStatus: response.status(),
                isCorrectBehavior,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(result);
            
            if (isCorrectBehavior) {
                console.log(`✅ ${path}: Comportamiento correcto`);
            } else {
                console.log(`❌ ${path}: Comportamiento incorrecto`);
                console.log(`   Esperado: ${shouldHaveAccess ? 'acceso' : 'denegado'}, Actual: ${hasAccess ? 'acceso' : 'denegado'}`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Error probando ${path}:`, error.message);
            
            const result = {
                path,
                userRole,
                shouldHaveAccess,
                error: error.message,
                isCorrectBehavior: false,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(result);
            return result;
        }
    }

    // Ejecutar pruebas para un usuario específico
    async testUserRoutes(userRole) {
        console.log(`\n🔑 Probando rutas como ${userRole}...`);
        
        if (userRole === 'unauthenticated') {
            await this.clearAuth();
        } else {
            await this.setUser(userRole);
        }
        
        // Probar todas las rutas
        for (const routeConfig of this.routeTests) {
            await this.testRoute(routeConfig, userRole);
        }
    }

    // Ejecutar todas las pruebas
    async runAllTests() {
        console.log('🧪 Iniciando pruebas automatizadas de rutas...\n');
        
        try {
            await this.init();
            
            // Probar con diferentes tipos de usuario
            await this.testUserRoutes('admin');
            await this.testUserRoutes('production');
            await this.testUserRoutes('unauthenticated');
            
            // Generar reporte
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Error durante las pruebas:', error);
        } finally {
            await this.cleanup();
        }
    }

    // Generar reporte detallado
    async generateReport() {
        console.log('\n📊 REPORTE DE PRUEBAS AUTOMATIZADAS');
        console.log('=' .repeat(60));
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.isCorrectBehavior).length;
        const failed = total - passed;
        
        console.log(`\nRESUMEN:`);
        console.log(`Total de pruebas: ${total}`);
        console.log(`✅ Exitosas: ${passed}`);
        console.log(`❌ Fallidas: ${failed}`);
        console.log(`📈 Porcentaje de éxito: ${((passed/total) * 100).toFixed(1)}%`);
        
        // Agrupar resultados por usuario
        const resultsByUser = this.testResults.reduce((acc, result) => {
            if (!acc[result.userRole]) acc[result.userRole] = [];
            acc[result.userRole].push(result);
            return acc;
        }, {});
        
        Object.entries(resultsByUser).forEach(([userRole, results]) => {
            const userPassed = results.filter(r => r.isCorrectBehavior).length;
            const userTotal = results.length;
            
            console.log(`\n👤 ${userRole.toUpperCase()}:`);
            console.log(`   Exitosas: ${userPassed}/${userTotal}`);
            
            const failures = results.filter(r => !r.isCorrectBehavior);
            if (failures.length > 0) {
                console.log(`   Fallidas:`);
                failures.forEach(f => {
                    console.log(`     ❌ ${f.path}: ${f.error || 'Comportamiento incorrecto'}`);
                });
            }
        });
        
        // Guardar reporte en archivo
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed,
                failed,
                successRate: ((passed/total) * 100).toFixed(1)
            },
            results: this.testResults,
            configuration: {
                baseUrl: this.baseUrl,
                routeTests: this.routeTests,
                testUsers: Object.keys(this.testUsers)
            }
        };
        
        const reportPath = path.join(__dirname, '../logs/automated-route-tests.json');
        try {
            // Crear directorio logs si no existe
            const logsDir = path.dirname(reportPath);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
            
            // También guardar reporte en HTML
            await this.generateHtmlReport(reportData);
            
        } catch (error) {
            console.error(`❌ Error al guardar reporte: ${error.message}`);
        }
        
        return reportData;
    }

    // Generar reporte HTML
    async generateHtmlReport(reportData) {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Pruebas de Rutas</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { background-color: #d4edda; }
        .fail { background-color: #f8d7da; }
    </style>
</head>
<body>
    <h1 class="header">🧪 Reporte de Pruebas de Protección de Rutas</h1>
    
    <div class="summary">
        <h2>📊 Resumen</h2>
        <p><strong>Fecha:</strong> ${new Date(reportData.timestamp).toLocaleString()}</p>
        <p><strong>Total de pruebas:</strong> ${reportData.summary.total}</p>
        <p><strong class="success">Exitosas:</strong> ${reportData.summary.passed}</p>
        <p><strong class="error">Fallidas:</strong> ${reportData.summary.failed}</p>
        <p><strong>Porcentaje de éxito:</strong> ${reportData.summary.successRate}%</p>
    </div>
    
    <h2>📋 Resultados Detallados</h2>
    <table>
        <thead>
            <tr>
                <th>Ruta</th>
                <th>Usuario</th>
                <th>Acceso Esperado</th>
                <th>Acceso Actual</th>
                <th>Resultado</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.results.map(result => `
                <tr class="${result.isCorrectBehavior ? 'pass' : 'fail'}">
                    <td>${result.path}</td>
                    <td>${result.userRole}</td>
                    <td>${result.shouldHaveAccess ? '✅ Permitido' : '❌ Denegado'}</td>
                    <td>${result.hasAccess ? '✅ Permitido' : '❌ Denegado'}</td>
                    <td>${result.isCorrectBehavior ? '✅ Correcto' : '❌ Incorrecto'}</td>
                    <td>${result.error || (result.wasRedirected ? 'Redirigido' : 'Directo')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <script>
        console.log('Datos del reporte:', ${JSON.stringify(reportData, null, 2)});
    </script>
</body>
</html>`;
        
        const htmlPath = path.join(__dirname, '../logs/route-tests-report.html');
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`📄 Reporte HTML guardado en: ${htmlPath}`);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const tester = new AutomatedRouteTests();
    tester.runAllTests()
        .then(() => {
            console.log('\n🏁 Pruebas completadas exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = AutomatedRouteTests;
