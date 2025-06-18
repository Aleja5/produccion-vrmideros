# Script para actualizar URLs hardcodeadas en el frontend
Write-Host "🔧 Actualizando URLs hardcodeadas en el frontend..." -ForegroundColor Green

$frontendDir = "frontend\src"
$files = @(
    "$frontendDir\pages\Operarios.jsx",
    "$frontendDir\pages\Maquinas.jsx", 
    "$frontendDir\pages\Procesos.jsx",
    "$frontendDir\pages\Insumos.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "🔄 Procesando: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Agregar import si no existe
        if ($content -notmatch "buildApiUrl") {
            Write-Host "  ➕ Agregando import de buildApiUrl"
            $content = $content -replace "import axios from 'axios';", "import axios from 'axios';`nimport { buildApiUrl } from '../config/api';"
        }
        
        # Reemplazar URLs hardcodeadas
        Write-Host "  🔄 Reemplazando URLs hardcodeadas"
        $content = $content -replace "http://localhost:5000/api/", "buildApiUrl('api/"
        $content = $content -replace "http://localhost:5000/api/", 'buildApiUrl("api/'
        $content = $content -replace '`http://localhost:5000/api/([^`]*)`', 'buildApiUrl(`api/$1`)'
        
        # Arreglar sintaxis específica
        $content = $content -replace "buildApiUrl\('api/([^']*)'([^)]*)\)", 'buildApiUrl(`api/$1`$2)'
        $content = $content -replace 'buildApiUrl\("api/([^"]*)"([^)]*)\)', 'buildApiUrl(`api/$1`$2)'
        
        Set-Content $file $content
        Write-Host "  ✅ Completado: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Archivo no encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "🎉 ¡Actualización completada!" -ForegroundColor Green
Write-Host "📝 Recuerda hacer commit de los cambios:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m `"🔧 URLs actualizadas para configuración centralizada`"" -ForegroundColor White
Write-Host "   git push origin Prueba" -ForegroundColor White
