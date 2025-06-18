/**
 * Script para verificar configuración de seguridad del proyecto
 * Ejecutar con: node scripts/security-audit.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityAudit {
    constructor() {
        this.findings = [];
        this.recommendations = [];
        this.projectRoot = path.join(__dirname, '..');
        this.frontendPath = path.join(this.projectRoot, 'frontend');
        this.backendPath = path.join(this.projectRoot, 'backend');
    }

    log(type, category, message, severity = 'medium') {
        const finding = {
            type,
            category,
            message,
            severity,
            timestamp: new Date().toISOString()
        };
        
        this.findings.push(finding);
        
        const icons = {
            error: '🚨',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };
        
        console.log(`${icons[type]} [${category.toUpperCase()}] ${message}`);
    }

    recommend(category, message) {
        this.recommendations.push({
            category,
            message,
            timestamp: new Date().toISOString()
        });
        console.log(`💡 [${category.toUpperCase()}] ${message}`);
    }

    // Verificar configuración de JWT
    checkJwtSecurity() {
        console.log('\n🔐 Verificando configuración JWT...\n');
        
        try {
            // Verificar variables de entorno
            const envPath = path.join(this.backendPath, '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                
                // Verificar JWT_SECRET
                if (envContent.includes('JWT_SECRET')) {
                    const secretMatch = envContent.match(/JWT_SECRET\s*=\s*(.+)/);
                    if (secretMatch) {
                        const secret = secretMatch[1].trim();
                        if (secret.length < 32) {
                            this.log('warning', 'jwt', 'JWT_SECRET es demasiado corto (< 32 caracteres)', 'high');
                            this.recommend('jwt', 'Usar un secret de al menos 32 caracteres');
                        } else {
                            this.log('success', 'jwt', 'JWT_SECRET tiene longitud adecuada');
                        }
                        
                        // Verificar complejidad
                        const hasNumbers = /\d/.test(secret);
                        const hasLetters = /[a-zA-Z]/.test(secret);
                        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(secret);
                        
                        if (!hasNumbers || !hasLetters || !hasSpecial) {
                            this.log('warning', 'jwt', 'JWT_SECRET podría ser más complejo', 'medium');
                            this.recommend('jwt', 'Incluir números, letras y caracteres especiales en JWT_SECRET');
                        }
                    }
                } else {
                    this.log('error', 'jwt', 'JWT_SECRET no encontrado en .env', 'critical');
                    this.recommend('jwt', 'Configurar JWT_SECRET en archivo .env');
                }
                
                // Verificar JWT_EXPIRE
                if (envContent.includes('JWT_EXPIRE')) {
                    this.log('success', 'jwt', 'JWT_EXPIRE configurado');
                } else {
                    this.log('warning', 'jwt', 'JWT_EXPIRE no configurado', 'medium');
                    this.recommend('jwt', 'Configurar JWT_EXPIRE para controlar duración de tokens');
                }
                
            } else {
                this.log('error', 'jwt', 'Archivo .env no encontrado', 'critical');
                this.recommend('jwt', 'Crear archivo .env con configuraciones de seguridad');
            }
            
        } catch (error) {
            this.log('error', 'jwt', `Error verificando JWT: ${error.message}`, 'high');
        }
    }

    // Verificar middleware de seguridad
    checkSecurityMiddleware() {
        console.log('\n🛡️ Verificando middleware de seguridad...\n');
        
        try {
            const serverPath = path.join(this.backendPath, 'server.js');
            if (fs.existsSync(serverPath)) {
                const serverContent = fs.readFileSync(serverPath, 'utf8');
                
                // Verificar CORS
                if (serverContent.includes('cors')) {
                    this.log('success', 'middleware', 'CORS configurado');
                    
                    // Verificar configuración específica de CORS
                    if (serverContent.includes('origin:') || serverContent.includes('credentials:')) {
                        this.log('success', 'middleware', 'CORS configurado específicamente');
                    } else {
                        this.log('warning', 'middleware', 'CORS podría necesitar configuración específica', 'medium');
                        this.recommend('middleware', 'Configurar CORS con origen específico en producción');
                    }
                } else {
                    this.log('warning', 'middleware', 'CORS no configurado', 'high');
                    this.recommend('middleware', 'Instalar y configurar middleware CORS');
                }
                
                // Verificar helmet
                if (serverContent.includes('helmet')) {
                    this.log('success', 'middleware', 'Helmet configurado para headers de seguridad');
                } else {
                    this.log('warning', 'middleware', 'Helmet no configurado', 'medium');
                    this.recommend('middleware', 'Instalar helmet para headers de seguridad');
                }
                
                // Verificar rate limiting
                if (serverContent.includes('rateLimit') || serverContent.includes('express-rate-limit')) {
                    this.log('success', 'middleware', 'Rate limiting configurado');
                } else {
                    this.log('warning', 'middleware', 'Rate limiting no configurado', 'medium');
                    this.recommend('middleware', 'Implementar rate limiting para prevenir ataques');
                }                // Verificar express-validator
                const routesDir = path.join(this.backendPath, 'src/routes');
                let hasValidation = false;
                
                if (fs.existsSync(routesDir)) {
                    const routeFiles = fs.readdirSync(routesDir);
                    for (const file of routeFiles) {
                        if (file.endsWith('.js')) {
                            const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf8');
                            if (routeContent.includes('express-validator') || routeContent.includes('validationResult')) {
                                hasValidation = true;
                                break;
                            }
                        }
                    }
                }
                
                if (hasValidation || serverContent.includes('express-validator') || serverContent.includes('validationResult')) {
                    this.log('success', 'middleware', 'Validación de entrada implementada');
                } else {
                    this.log('warning', 'middleware', 'Validación de entrada no detectada', 'medium');
                    this.recommend('middleware', 'Implementar validación de entrada con express-validator');
                }
                
            } else {
                this.log('error', 'middleware', 'server.js no encontrado', 'high');
            }
            
        } catch (error) {
            this.log('error', 'middleware', `Error verificando middleware: ${error.message}`, 'high');
        }
    }

    // Verificar configuración de base de datos
    checkDatabaseSecurity() {
        console.log('\n🗄️ Verificando seguridad de base de datos...\n');
        
        try {
            const dbPath = path.join(this.backendPath, 'src/db/db.js');
            if (fs.existsSync(dbPath)) {
                const dbContent = fs.readFileSync(dbPath, 'utf8');
                
                // Verificar que no hay credenciales hardcodeadas
                const suspiciousPatterns = [
                    /password\s*[:=]\s*['"][^'"]+['"]/gi,
                    /user\s*[:=]\s*['"]root['"]/gi,
                    /host\s*[:=]\s*['"]localhost['"]/gi
                ];
                
                let foundHardcoded = false;
                suspiciousPatterns.forEach(pattern => {
                    if (pattern.test(dbContent)) {
                        foundHardcoded = true;
                    }
                });
                
                if (foundHardcoded) {
                    this.log('warning', 'database', 'Posibles credenciales hardcodeadas detectadas', 'high');
                    this.recommend('database', 'Mover credenciales de DB a variables de entorno');
                } else {
                    this.log('success', 'database', 'No se detectaron credenciales hardcodeadas');
                }
                
                // Verificar uso de variables de entorno
                if (dbContent.includes('process.env')) {
                    this.log('success', 'database', 'Uso de variables de entorno detectado');
                } else {
                    this.log('warning', 'database', 'No se detecta uso de variables de entorno', 'medium');
                    this.recommend('database', 'Usar variables de entorno para configuración de DB');
                }
                
                // Verificar SSL/TLS
                if (dbContent.includes('ssl') || dbContent.includes('tls')) {
                    this.log('success', 'database', 'Configuración SSL/TLS detectada');
                } else {
                    this.log('info', 'database', 'Configuración SSL/TLS no detectada');
                    this.recommend('database', 'Considerar SSL/TLS para conexiones de producción');
                }
                
            } else {
                this.log('warning', 'database', 'Archivo de configuración DB no encontrado', 'medium');
            }
            
        } catch (error) {
            this.log('error', 'database', `Error verificando DB: ${error.message}`, 'high');
        }
    }

    // Verificar archivos sensibles
    checkSensitiveFiles() {
        console.log('\n📁 Verificando archivos sensibles...\n');
        
        const sensitiveFiles = [
            '.env',
            'config.json',
            'credentials.json',
            'private.key',
            'server.key'
        ];
        
        const gitignorePath = path.join(this.projectRoot, '.gitignore');
        let gitignoreContent = '';
        
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            this.log('success', 'files', '.gitignore encontrado');
        } else {
            this.log('warning', 'files', '.gitignore no encontrado', 'medium');
            this.recommend('files', 'Crear archivo .gitignore');
        }
        
        sensitiveFiles.forEach(file => {
            const backendFile = path.join(this.backendPath, file);
            const frontendFile = path.join(this.frontendPath, file);
            
            if (fs.existsSync(backendFile) || fs.existsSync(frontendFile)) {
                if (gitignoreContent.includes(file)) {
                    this.log('success', 'files', `${file} está en .gitignore`);
                } else {
                    this.log('warning', 'files', `${file} existe pero NO está en .gitignore`, 'high');
                    this.recommend('files', `Agregar ${file} a .gitignore`);
                }
            }
        });
        
        // Verificar node_modules
        if (gitignoreContent.includes('node_modules')) {
            this.log('success', 'files', 'node_modules está en .gitignore');
        } else {
            this.log('warning', 'files', 'node_modules no está en .gitignore', 'medium');
            this.recommend('files', 'Agregar node_modules a .gitignore');
        }
    }

    // Verificar configuración HTTPS
    checkHttpsConfig() {
        console.log('\n🔒 Verificando configuración HTTPS...\n');
        
        try {
            const httpsPath = path.join(this.backendPath, 'src/config/https.js');
            if (fs.existsSync(httpsPath)) {
                const httpsContent = fs.readFileSync(httpsPath, 'utf8');
                
                this.log('success', 'https', 'Configuración HTTPS encontrada');
                
                // Verificar certificados
                if (httpsContent.includes('cert') && httpsContent.includes('key')) {
                    this.log('success', 'https', 'Certificados SSL configurados');
                } else {
                    this.log('warning', 'https', 'Certificados SSL no completamente configurados', 'medium');
                    this.recommend('https', 'Verificar configuración completa de certificados SSL');
                }
                
                // Verificar redirección HTTP a HTTPS
                if (httpsContent.includes('redirect') || httpsContent.includes('301')) {
                    this.log('success', 'https', 'Redirección HTTP a HTTPS configurada');
                } else {
                    this.log('info', 'https', 'Redirección HTTP a HTTPS no detectada');
                    this.recommend('https', 'Configurar redirección automática HTTP a HTTPS');
                }
                
            } else {
                this.log('info', 'https', 'Configuración HTTPS no encontrada');
                this.recommend('https', 'Configurar HTTPS para producción');
            }
            
        } catch (error) {
            this.log('error', 'https', `Error verificando HTTPS: ${error.message}`, 'medium');
        }
    }

    // Verificar dependencias con vulnerabilidades
    async checkDependencies() {
        console.log('\n📦 Verificando dependencias...\n');
        
        const packageFiles = [
            path.join(this.backendPath, 'package.json'),
            path.join(this.frontendPath, 'package.json')
        ];
        
        packageFiles.forEach(packagePath => {
            if (fs.existsSync(packagePath)) {
                try {
                    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    const isBackend = packagePath.includes('backend');
                    const context = isBackend ? 'backend' : 'frontend';
                    
                    this.log('success', 'dependencies', `package.json encontrado en ${context}`);
                    
                    // Verificar dependencias de seguridad recomendadas
                    const securityDeps = {
                        backend: ['helmet', 'cors', 'express-rate-limit', 'express-validator', 'bcryptjs', 'jsonwebtoken'],
                        frontend: ['js-cookie']
                    };
                    
                    const recommendedDeps = securityDeps[context] || [];
                    const allDeps = {...(packageContent.dependencies || {}), ...(packageContent.devDependencies || {})};
                    
                    recommendedDeps.forEach(dep => {
                        if (allDeps[dep]) {
                            this.log('success', 'dependencies', `${dep} instalado en ${context}`);
                        } else {
                            this.log('info', 'dependencies', `${dep} no encontrado en ${context}`);
                            this.recommend('dependencies', `Considerar instalar ${dep} en ${context}`);
                        }
                    });
                    
                    // Verificar dependencias potencialmente inseguras
                    const insecureDeps = ['eval', 'vm2', 'serialize-javascript'];
                    insecureDeps.forEach(dep => {
                        if (allDeps[dep]) {
                            this.log('warning', 'dependencies', `Dependencia potencialmente insegura: ${dep}`, 'medium');
                            this.recommend('dependencies', `Revisar uso de ${dep} y considerar alternativas`);
                        }
                    });
                    
                } catch (error) {
                    this.log('error', 'dependencies', `Error leyendo ${packagePath}: ${error.message}`, 'medium');
                }
            }
        });
    }

    // Generar reporte de seguridad
    generateSecurityReport() {
        console.log('\n📊 REPORTE DE AUDITORÍA DE SEGURIDAD');
        console.log('=' .repeat(60));
        
        const criticalFindings = this.findings.filter(f => f.severity === 'critical');
        const highFindings = this.findings.filter(f => f.severity === 'high');
        const mediumFindings = this.findings.filter(f => f.severity === 'medium');
        const lowFindings = this.findings.filter(f => f.severity === 'low');
        
        console.log(`\n🚨 CRÍTICO: ${criticalFindings.length}`);
        console.log(`🔴 ALTO: ${highFindings.length}`);
        console.log(`🟡 MEDIO: ${mediumFindings.length}`);
        console.log(`🔵 BAJO: ${lowFindings.length}`);
        
        if (criticalFindings.length > 0) {
            console.log('\n🚨 PROBLEMAS CRÍTICOS:');
            criticalFindings.forEach(f => console.log(`   ${f.message}`));
        }
        
        if (highFindings.length > 0) {
            console.log('\n🔴 PROBLEMAS DE ALTA PRIORIDAD:');
            highFindings.forEach(f => console.log(`   ${f.message}`));
        }        
        console.log(`\n💡 RECOMENDACIONES: ${this.recommendations.length}`);
        if (this.recommendations.length > 0) {
            console.log('\nTOP 5 RECOMENDACIONES:');
            this.recommendations.slice(0, 5).forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.message}`);
            });
        }        // Calcular puntuación de seguridad
        const totalChecks = this.findings.length;
        const successfulChecks = this.findings.filter(f => f.type === 'success').length;
        const criticalIssues = criticalFindings.length;
        const highIssues = highFindings.length;
        const mediumIssues = this.findings.filter(f => f.type === 'warning' && f.severity === 'medium').length;
        
        // Puntuación base según éxitos
        let baseScore = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
        
        // Penalizaciones solo por problemas reales
        const criticalPenalty = criticalIssues * 30;
        const highPenalty = highIssues * 20;
        const mediumPenalty = mediumIssues * 5;
        
        const securityScore = Math.max(0, Math.min(100, baseScore - criticalPenalty - highPenalty - mediumPenalty));
        
        console.log(`\n🎯 PUNTUACIÓN DE SEGURIDAD: ${securityScore}/100`);
        
        if (securityScore >= 90) {
            console.log('🟢 EXCELENTE - Seguridad muy buena');
        } else if (securityScore >= 70) {
            console.log('🟡 BUENO - Algunas mejoras necesarias');
        } else if (securityScore >= 50) {
            console.log('🟠 REGULAR - Varias mejoras requeridas');
        } else {
            console.log('🔴 DEFICIENTE - Mejoras críticas requeridas');
        }
        
        // Guardar reporte
        const reportData = {
            timestamp: new Date().toISOString(),
            securityScore,
            summary: {
                critical: criticalFindings.length,
                high: highFindings.length,
                medium: mediumFindings.length,
                low: lowFindings.length,
                totalRecommendations: this.recommendations.length
            },
            findings: this.findings,
            recommendations: this.recommendations
        };
        
        const reportPath = path.join(this.projectRoot, 'logs/security-audit.json');
        try {
            const logsDir = path.dirname(reportPath);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
        } catch (error) {
            console.log(`\n❌ Error al guardar reporte: ${error.message}`);
        }
        
        return reportData;
    }

    // Ejecutar auditoría completa
    async runFullAudit() {
        console.log('🔍 Iniciando auditoría de seguridad...\n');
        
        this.checkJwtSecurity();
        this.checkSecurityMiddleware();
        this.checkDatabaseSecurity();
        this.checkSensitiveFiles();
        this.checkHttpsConfig();
        await this.checkDependencies();
        
        const report = this.generateSecurityReport();
        
        console.log('\n🏁 Auditoría de seguridad completada.');
        return report;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const audit = new SecurityAudit();
    audit.runFullAudit()
        .then(report => {
            const exitCode = report.summary.critical > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('❌ Error durante la auditoría:', error);
            process.exit(1);
        });
}

module.exports = SecurityAudit;
