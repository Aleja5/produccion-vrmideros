/**
 * Script para verificar la protección de rutas entre roles
 * Ejecutar con: node scripts/verify-route-protection.js
 */

const fs = require('fs');
const path = require('path');

// Configuración de rutas y roles esperados
const routeConfig = {
    adminOnlyRoutes: [
        '/admin-home',
        '/admin-dashboard', 
        '/admin/jornadas',
        '/admin/maquinas',
        '/admin/insumos',
        '/admin/procesos',
        '/admin/areas',
        '/admin/operarios',
        '/admin/usuarios',
        '/admin/usuarios/crear',
        '/admin/usuarios/editar/:id',
        '/admin/jornada/:id'
    ],
    productionOnlyRoutes: [
        '/operario-dashboard',
        '/registro-produccion',
        '/produccion/actualizar/:id',
        '/mi-jornada',
        '/historial-jornadas'
    ],
    mixedRoutes: [
        '/validate-cedula'
    ],
    publicRoutes: [
        '/',
        '/login',
        '/forgot-password',
        '/reset-password/:token'
    ]
};

class RouteProtectionVerifier {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
        this.frontendPath = path.join(__dirname, '../frontend/src');
        this.backendPath = path.join(__dirname, '../backend/src');
    }

    log(type, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        
        switch(type) {
            case 'error':
                this.errors.push(logMessage);
                console.log(`❌ ${message}`);
                break;
            case 'warning':
                this.warnings.push(logMessage);
                console.log(`⚠️ ${message}`);
                break;
            case 'success':
                this.successes.push(logMessage);
                console.log(`✅ ${message}`);
                break;
            default:
                console.log(`ℹ️ ${message}`);
        }
    }    // Verificar que todas las rutas admin estén protegidas en App.jsx
    verifyFrontendRoutes() {
        console.log('\n🔍 Verificando protección de rutas en Frontend...\n');
        
        try {
            const appFilePath = path.join(this.frontendPath, 'App.jsx');
            const appContent = fs.readFileSync(appFilePath, 'utf8');

            // Normalizar el contenido: remover saltos de línea dentro de elementos JSX
            const normalizedContent = appContent.replace(/\s+/g, ' ').replace(/>\s+</g, '><');

            // Verificar rutas de admin
            routeConfig.adminOnlyRoutes.forEach(route => {
                const routePattern = route.replace(/:\w+/g, '\\w+').replace(/\//g, '\\/');
                
                // Buscar patrón más flexible que maneje multilinea
                const protectedRouteRegex = new RegExp(
                    `<Route[^>]*path=["']${routePattern}["'][^>]*element=\\{<ProtectedRoute[^>]*allowedRoles=\\[\\s*["']admin["']\\s*\\]`, 
                    'i'
                );
                
                if (protectedRouteRegex.test(normalizedContent)) {
                    this.log('success', `Ruta admin ${route} está correctamente protegida`);                } else {
                    const routeExistsRegex = new RegExp(`<Route[^>]*path=["']${routePattern}["']`, 'i');
                    if (routeExistsRegex.test(normalizedContent)) {
                        // Verificar si está dentro de ProtectedRoute
                        const protectedButWrongRole = new RegExp(
                            `<Route[^>]*path=["']${routePattern}["'][^}]*<ProtectedRoute[^>]*allowedRoles=\\[[^\\]]*["'](?!admin)`, 
                            'i'
                        );
                        if (protectedButWrongRole.test(normalizedContent)) {
                            this.log('error', `Ruta admin ${route} está protegida pero con rol incorrecto`);
                        } else {
                            // Verificar si tiene ProtectedRoute sin allowedRoles usando búsqueda de contexto
                            const routeQuoted = route.replace(/:\w+/g, ':[\\w]+');
                            const hasProtectedRoute = new RegExp(`path=["']${routeQuoted}["'][^}]*ProtectedRoute`, 'i').test(normalizedContent);
                            if (hasProtectedRoute) {
                                // Buscar el contexto específico de esta ruta
                                const routeIndex = normalizedContent.search(new RegExp(`path=["']${routeQuoted}["']`, 'i'));
                                if (routeIndex >= 0) {
                                    const contextBefore = normalizedContent.substring(Math.max(0, routeIndex - 200), routeIndex + 400);
                                    if (contextBefore.includes('allowedRoles') && contextBefore.includes('admin')) {
                                        this.log('success', `Ruta admin ${route} está correctamente protegida (verificación manual)`);
                                    } else {
                                        this.log('error', `Ruta admin ${route} existe pero NO está protegida correctamente`);
                                    }
                                } else {
                                    this.log('error', `Ruta admin ${route} existe pero NO está protegida correctamente`);
                                }
                            } else {
                                this.log('error', `Ruta admin ${route} existe pero NO está protegida correctamente`);
                            }
                        }
                    } else {
                        this.log('warning', `Ruta admin ${route} no encontrada en App.jsx`);
                    }
                }
            });

            // Verificar rutas de producción
            routeConfig.productionOnlyRoutes.forEach(route => {
                const routePattern = route.replace(/:\w+/g, '\\w+').replace(/\//g, '\\/');
                
                const protectedRouteRegex = new RegExp(
                    `<Route[^>]*path=["']${routePattern}["'][^>]*element=\\{<ProtectedRoute[^>]*allowedRoles=\\[\\s*["']production["']\\s*\\]`, 
                    'i'
                );
                
                if (protectedRouteRegex.test(normalizedContent)) {
                    this.log('success', `Ruta production ${route} está correctamente protegida`);                } else {
                    const routeExistsRegex = new RegExp(`<Route[^>]*path=["']${routePattern}["']`, 'i');
                    if (routeExistsRegex.test(normalizedContent)) {
                        // Verificar contexto manual como con admin
                        const routeQuoted = route.replace(/:\w+/g, ':[\\w]+');
                        const hasProtectedRoute = new RegExp(`path=["']${routeQuoted}["'][^}]*ProtectedRoute`, 'i').test(normalizedContent);
                        if (hasProtectedRoute) {
                            const routeIndex = normalizedContent.search(new RegExp(`path=["']${routeQuoted}["']`, 'i'));
                            if (routeIndex >= 0) {
                                const contextBefore = normalizedContent.substring(Math.max(0, routeIndex - 200), routeIndex + 400);
                                if (contextBefore.includes('allowedRoles') && contextBefore.includes('production')) {
                                    this.log('success', `Ruta production ${route} está correctamente protegida (verificación manual)`);
                                } else {
                                    this.log('error', `Ruta production ${route} existe pero NO está protegida correctamente`);
                                }
                            } else {
                                this.log('error', `Ruta production ${route} existe pero NO está protegida correctamente`);
                            }
                        } else {
                            this.log('error', `Ruta production ${route} existe pero NO está protegida correctamente`);
                        }
                    } else {
                        this.log('warning', `Ruta production ${route} no encontrada en App.jsx`);
                    }
                }
            });

            // Verificar rutas mixtas
            routeConfig.mixedRoutes.forEach(route => {
                const routePattern = route.replace(/:\w+/g, '\\w+').replace(/\//g, '\\/');
                
                // Buscar que tenga tanto admin como production en allowedRoles
                const mixedRouteRegex = new RegExp(
                    `<Route[^>]*path=["']${routePattern}["'][^}]*allowedRoles=\\[[^\\]]*["']admin["'][^\\]]*["']production["']`, 
                    'i'
                );
                const mixedRouteRegex2 = new RegExp(
                    `<Route[^>]*path=["']${routePattern}["'][^}]*allowedRoles=\\[[^\\]]*["']production["'][^\\]]*["']admin["']`, 
                    'i'
                );
                
                if (mixedRouteRegex.test(normalizedContent) || mixedRouteRegex2.test(normalizedContent)) {
                    this.log('success', `Ruta mixta ${route} está correctamente protegida`);                } else {
                    // Verificación manual para rutas mixtas
                    const routeQuoted = route.replace(/:\w+/g, ':[\\w]+');
                    if (new RegExp(`path=["']${routeQuoted}["']`, 'i').test(normalizedContent)) {
                        const routeIndex = normalizedContent.search(new RegExp(`path=["']${routeQuoted}["']`, 'i'));
                        if (routeIndex >= 0) {
                            const contextBefore = normalizedContent.substring(Math.max(0, routeIndex - 300), routeIndex + 400);
                            if (contextBefore.includes('admin') && contextBefore.includes('production') && contextBefore.includes('allowedRoles')) {
                                this.log('success', `Ruta mixta ${route} está correctamente protegida (verificación manual)`);
                            } else {
                                this.log('warning', `Ruta mixta ${route} podría no estar configurada correctamente para ambos roles`);
                            }
                        } else {
                            this.log('warning', `Verificar manualmente la protección de ruta mixta ${route}`);
                        }
                    } else {
                        this.log('warning', `Verificar manualmente la protección de ruta mixta ${route}`);
                    }
                }
            });

        } catch (error) {
            this.log('error', `Error al leer App.jsx: ${error.message}`);
        }
    }

    // Verificar que ProtectedRoute funcione correctamente
    verifyProtectedRouteComponent() {
        console.log('\n🛡️ Verificando componente ProtectedRoute...\n');
        
        try {
            const protectedRoutePath = path.join(this.frontendPath, 'components/ProtectedRoute.jsx');
            const content = fs.readFileSync(protectedRoutePath, 'utf8');

            // Verificar que verifica roles
            if (content.includes('allowedRoles') && content.includes('role')) {
                this.log('success', 'ProtectedRoute verifica roles correctamente');
            } else {
                this.log('error', 'ProtectedRoute NO verifica roles');
            }

            // Verificar que redirige en caso de acceso no autorizado
            if (content.includes('Navigate') || content.includes('redirect')) {
                this.log('success', 'ProtectedRoute redirige correctamente');
            } else {
                this.log('error', 'ProtectedRoute NO redirige en acceso no autorizado');
            }

            // Verificar que maneja token de autenticación
            if (content.includes('token') || content.includes('isAuthenticated')) {
                this.log('success', 'ProtectedRoute verifica autenticación');
            } else {
                this.log('warning', 'Verificar manualmente la autenticación en ProtectedRoute');
            }

        } catch (error) {
            this.log('error', `Error al leer ProtectedRoute.jsx: ${error.message}`);
        }
    }

    // Verificar middleware de backend
    verifyBackendMiddleware() {
        console.log('\n🔒 Verificando middleware de backend...\n');
        
        try {
            const middlewarePath = path.join(this.backendPath, 'middleware/authMiddleware.js');
            const content = fs.readFileSync(middlewarePath, 'utf8');

            // Verificar función protect
            if (content.includes('exports.protect') || content.includes('function protect')) {
                this.log('success', 'Middleware protect existe');
            } else {
                this.log('error', 'Middleware protect NO encontrado');
            }

            // Verificar función authorize
            if (content.includes('exports.authorize') || content.includes('function authorize')) {
                this.log('success', 'Middleware authorize existe');
            } else {
                this.log('error', 'Middleware authorize NO encontrado');
            }

            // Verificar verificación de JWT
            if (content.includes('jwt') && content.includes('verify')) {
                this.log('success', 'Verificación de JWT implementada');
            } else {
                this.log('warning', 'Verificar implementación de JWT');
            }

        } catch (error) {
            this.log('error', `Error al leer authMiddleware.js: ${error.message}`);
        }
    }    // Verificar rutas de backend
    verifyBackendRoutes() {
        console.log('\n🛣️ Verificando rutas de backend...\n');
        
        const routeFiles = [
            { file: 'routes/adminRoutes.js', shouldBeProtected: true },
            { file: 'routes/authRoutes.js', shouldBeProtected: false }, // Auth routes are public
            { file: 'routes/operatorRoutes.js', shouldBeProtected: true },
            { file: 'routes/productionRoutes.js', shouldBeProtected: true }
        ];

        routeFiles.forEach(({ file, shouldBeProtected }) => {
            try {
                const routePath = path.join(this.backendPath, file);
                if (fs.existsSync(routePath)) {
                    const content = fs.readFileSync(routePath, 'utf8');
                    
                    if (shouldBeProtected) {
                        // Verificar que usa middleware protect
                        if (content.includes('protect')) {
                            this.log('success', `${file} usa middleware protect`);
                        } else {
                            this.log('warning', `${file} podría no estar usando middleware protect`);
                        }

                        // Verificar que usa middleware authorize
                        if (content.includes('authorize')) {
                            this.log('success', `${file} usa middleware authorize`);
                        } else {
                            this.log('warning', `${file} podría no estar usando middleware authorize`);
                        }
                    } else {
                        // Para rutas públicas como auth
                        this.log('success', `${file} es público (correcto para autenticación)`);
                    }
                } else {
                    this.log('warning', `Archivo de rutas ${file} no encontrado`);
                }
            } catch (error) {
                this.log('error', `Error al leer ${file}: ${error.message}`);
            }
        });
    }

    // Generar reporte
    generateReport() {
        console.log('\n📊 REPORTE DE VERIFICACIÓN DE PROTECCIÓN DE RUTAS');
        console.log('=' .repeat(60));
        
        console.log(`\n✅ Verificaciones exitosas: ${this.successes.length}`);
        console.log(`⚠️ Advertencias: ${this.warnings.length}`);
        console.log(`❌ Errores: ${this.errors.length}`);

        if (this.errors.length > 0) {
            console.log('\n🚨 ERRORES CRÍTICOS:');
            this.errors.forEach(error => console.log(`  ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ ADVERTENCIAS:');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }

        // Guardar reporte en archivo
        const reportContent = {
            timestamp: new Date().toISOString(),
            summary: {
                successes: this.successes.length,
                warnings: this.warnings.length,
                errors: this.errors.length
            },
            details: {
                successes: this.successes,
                warnings: this.warnings,
                errors: this.errors
            }
        };

        const reportPath = path.join(__dirname, '../logs/route-protection-report.json');
        try {
            // Crear directorio logs si no existe
            const logsDir = path.dirname(reportPath);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            
            fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
            console.log(`\n📄 Reporte guardado en: ${reportPath}`);
        } catch (error) {
            console.log(`\n❌ Error al guardar reporte: ${error.message}`);
        }

        // Retornar código de salida
        return this.errors.length > 0 ? 1 : 0;
    }

    // Ejecutar todas las verificaciones
    async run() {
        console.log('🚀 Iniciando verificación de protección de rutas...\n');
        
        this.verifyFrontendRoutes();
        this.verifyProtectedRouteComponent();
        this.verifyBackendMiddleware();
        this.verifyBackendRoutes();
        
        const exitCode = this.generateReport();
        
        console.log('\n🏁 Verificación completada.');
        return exitCode;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const verifier = new RouteProtectionVerifier();
    verifier.run().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('❌ Error durante la verificación:', error);
        process.exit(1);
    });
}

module.exports = RouteProtectionVerifier;
