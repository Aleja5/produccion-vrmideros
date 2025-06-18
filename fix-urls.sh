#!/bin/bash

# Script para actualizar todas las URLs hardcodeadas en el frontend
echo "🔧 Actualizando URLs hardcodeadas en el frontend..."

# Directorio del frontend
FRONTEND_DIR="frontend/src"

# Encontrar todos los archivos JSX que contienen localhost:5000
echo "📁 Buscando archivos con URLs hardcodeadas..."

# Archivos a procesar
FILES=(
  "$FRONTEND_DIR/pages/Operarios.jsx"
  "$FRONTEND_DIR/pages/Maquinas.jsx"
  "$FRONTEND_DIR/pages/Procesos.jsx"
  "$FRONTEND_DIR/pages/Insumos.jsx"
)

# Agregar import de buildApiUrl a cada archivo si no existe
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "🔄 Procesando: $file"
    
    # Verificar si ya tiene el import
    if ! grep -q "buildApiUrl" "$file"; then
      echo "  ➕ Agregando import de buildApiUrl"
      # Agregar import después de la línea de axios
      sed -i "s/import axios from 'axios';/import axios from 'axios';\nimport { buildApiUrl } from '..\/config\/api';/" "$file"
    fi
    
    # Reemplazar todas las URLs hardcodeadas
    echo "  🔄 Reemplazando URLs hardcodeadas"
    sed -i 's/http:\/\/localhost:5000\/api\//buildApiUrl("api\//g' "$file"
    sed -i 's/`http:\/\/localhost:5000\/api\/\([^`]*\)`/buildApiUrl(`api\/\1`)/g' "$file"
    
    echo "  ✅ Completado: $file"
  else
    echo "  ⚠️  Archivo no encontrado: $file"
  fi
done

echo "🎉 ¡Actualización completada!"
echo "📝 Recuerda hacer commit de los cambios:"
echo "   git add ."
echo "   git commit -m \"🔧 Actualizadas URLs hardcodeadas para usar configuración centralizada\""
echo "   git push origin Prueba"
