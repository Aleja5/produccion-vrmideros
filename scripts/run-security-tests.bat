@echo off
echo.
echo ========================================
echo   SCRIPTS DE VERIFICACION DE SEGURIDAD
echo ========================================
echo.

:menu
echo Selecciona una opcion:
echo.
echo 1. Verificar proteccion de rutas (analisis estatico)
echo 2. Ejecutar pruebas automatizadas con Puppeteer
echo 3. Auditoria completa de seguridad
echo 4. Ejecutar todas las verificaciones
echo 5. Instalar dependencias de testing
echo 6. Abrir interfaz de testing en navegador
echo 7. Ver logs de testing
echo 8. Limpiar logs
echo 9. Salir
echo.
set /p choice="Ingresa tu opcion (1-9): "

if "%choice%"=="1" goto route_verification
if "%choice%"=="2" goto automated_tests
if "%choice%"=="3" goto security_audit
if "%choice%"=="4" goto all_tests
if "%choice%"=="5" goto install_deps
if "%choice%"=="6" goto open_ui
if "%choice%"=="7" goto view_logs
if "%choice%"=="8" goto clean_logs
if "%choice%"=="9" goto exit

echo Opcion invalida. Intenta de nuevo.
pause
goto menu

:route_verification
echo.
echo 🔍 Ejecutando verificacion de proteccion de rutas...
echo.
node scripts/verify-route-protection.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Se encontraron problemas en la verificacion
) else (
    echo.
    echo ✅ Verificacion completada exitosamente
)
pause
goto menu

:automated_tests
echo.
echo 🤖 Ejecutando pruebas automatizadas con Puppeteer...
echo Nota: Asegurate de que el servidor este ejecutandose en http://localhost:3000
echo.
pause
node scripts/automated-route-tests.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Las pruebas automatizadas fallaron
) else (
    echo.
    echo ✅ Pruebas automatizadas completadas
)
pause
goto menu

:security_audit
echo.
echo 🔒 Ejecutando auditoria de seguridad...
echo.
node scripts/security-audit.js
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Se encontraron problemas de seguridad criticos
) else (
    echo.
    echo ✅ Auditoria de seguridad completada
)
pause
goto menu

:all_tests
echo.
echo 🎯 Ejecutando todas las verificaciones...
echo.
echo Paso 1/3: Verificacion de rutas...
node scripts/verify-route-protection.js

echo.
echo Paso 2/3: Auditoria de seguridad...
node scripts/security-audit.js

echo.
echo Paso 3/3: Pruebas automatizadas...
echo Asegurate de que el servidor este ejecutandose...
pause
node scripts/automated-route-tests.js

echo.
echo 🏁 Todas las verificaciones completadas
echo Revisa los reportes en la carpeta logs/
pause
goto menu

:install_deps
echo.
echo 📦 Instalando dependencias de testing...
echo.
npm install puppeteer --save-dev
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error instalando dependencias
) else (
    echo.
    echo ✅ Dependencias instaladas correctamente
)
pause
goto menu

:open_ui
echo.
echo 🌐 Abriendo interfaz de testing en el navegador...
echo.
start scripts/testing-ui.html
echo ✅ Interfaz abierta en el navegador
pause
goto menu

:view_logs
echo.
echo 📄 Contenido de logs recientes:
echo.
if exist logs\route-protection-report.json (
    echo === REPORTE DE PROTECCION DE RUTAS ===
    type logs\route-protection-report.json | findstr "summary"
    echo.
)
if exist logs\security-audit.json (
    echo === REPORTE DE AUDITORIA DE SEGURIDAD ===
    type logs\security-audit.json | findstr "securityScore"
    echo.
)
if exist logs\automated-route-tests.json (
    echo === REPORTE DE PRUEBAS AUTOMATIZADAS ===
    type logs\automated-route-tests.json | findstr "summary"
    echo.
)
echo.
echo Para ver logs completos, abre los archivos en logs/
pause
goto menu

:clean_logs
echo.
echo 🧹 Limpiando logs de testing...
echo.
if exist logs\route-protection-report.json del logs\route-protection-report.json
if exist logs\security-audit.json del logs\security-audit.json
if exist logs\automated-route-tests.json del logs\automated-route-tests.json
if exist logs\route-tests-report.html del logs\route-tests-report.html
echo ✅ Logs limpiados
pause
goto menu

:exit
echo.
echo 👋 Gracias por usar los scripts de verificacion de seguridad!
echo.
exit /b 0
