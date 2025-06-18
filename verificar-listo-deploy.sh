#!/bin/bash

# 🚀 SCRIPT DE VERIFICACIÓN PRE-DESPLIEGUE
# Ejecuta este script antes de desplegar para verificar que todo esté listo

echo "🔍 VERIFICANDO PREPARACIÓN PARA DESPLIEGUE..."
echo "================================================"

# Verificar backend
echo "📦 Verificando Backend..."
cd backend

if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json NO encontrado en backend"
    exit 1
fi

if [ -f "server.js" ]; then
    echo "✅ server.js encontrado"
else
    echo "❌ server.js NO encontrado"
    exit 1
fi

if [ -f "start.js" ]; then
    echo "✅ start.js para producción encontrado"
else
    echo "❌ start.js NO encontrado - creando..."
    echo "require('dotenv').config(); require('./server.js');" > start.js
fi

# Verificar dependencias
echo "📋 Verificando dependencias..."
if npm list express > /dev/null 2>&1; then
    echo "✅ Express instalado"
else
    echo "❌ Express NO encontrado"
    exit 1
fi

# Verificar archivos de seguridad
if [ -f "verify-security.js" ]; then
    echo "✅ Script de verificación de seguridad encontrado"
    echo "🔒 Ejecutando verificación de seguridad..."
    node verify-security.js
else
    echo "⚠️ Script de verificación de seguridad NO encontrado"
fi

# Verificar frontend
echo ""
echo "🎨 Verificando Frontend..."
cd ../frontend

if [ -f "package.json" ]; then
    echo "✅ Frontend package.json encontrado"
else
    echo "❌ Frontend package.json NO encontrado"
    exit 1
fi

# Probar build del frontend
echo "🏗️ Probando build del frontend..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build del frontend exitoso"
    rm -rf dist
else
    echo "❌ Build del frontend falló"
    exit 1
fi

echo ""
echo "🎉 ¡VERIFICACIÓN COMPLETA!"
echo "================================================"
echo "✅ Tu aplicación está lista para desplegar"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Sube tu código a GitHub"
echo "2. Configura MongoDB Atlas"
echo "3. Despliega backend en Railway"
echo "4. Despliega frontend en Vercel"
echo "5. Configura variables de entorno"
echo ""
echo "📖 Lee GUIA-DESPLIEGUE-COMPLETA.md para instrucciones detalladas"
