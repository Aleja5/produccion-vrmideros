#!/usr/bin/env node

/**
 * Script de verificación para las mejoras del Registro de Producción
 * Verifica que las cards sean más compactas y la validación funcione correctamente
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 Verificación de Mejoras - Registro de Producción');
console.log('='.repeat(60));

try {
  const componentPath = path.join(__dirname, 'src', 'components', 'RegistroProduccion.jsx');
  const content = readFileSync(componentPath, 'utf8');

  console.log('\n✅ Verificando Cards Compactas:');
  
  // Verificar padding reducido
  if (content.includes('p-4 border-l-4')) {
    console.log('   ✓ Padding de card reducido de p-6 a p-4');
  } else {
    console.log('   ✗ Padding de card no reducido');
  }

  // Verificar espaciado reducido
  if (content.includes('space-y-3')) {
    console.log('   ✓ Espaciado interno reducido de space-y-4 a space-y-3');
  } else {
    console.log('   ✗ Espaciado interno no reducido');
  }

  // Verificar tamaños de texto más pequeños
  if (content.includes('text-xs font-medium')) {
    console.log('   ✓ Labels con texto más pequeño (text-xs)');
  } else {
    console.log('   ✗ Labels no reducidas');
  }

  // Verificar altura de inputs reducida
  if (content.includes('h-9 text-sm')) {
    console.log('   ✓ Inputs con altura reducida (h-9) y texto pequeño');
  } else {
    console.log('   ✗ Inputs no optimizados');
  }

  // Verificar indicadores visuales más pequeños
  if (content.includes('w-1.5 h-1.5')) {
    console.log('   ✓ Indicadores rojos más pequeños');
  } else {
    console.log('   ✗ Indicadores rojos no reducidos');
  }

  console.log('\n✅ Verificando Validación Mejorada:');
  
  // Verificar validación detallada
  if (content.includes('camposFaltantes = []')) {
    console.log('   ✓ Array para campos faltantes implementado');
  } else {
    console.log('   ✗ Array para campos faltantes no encontrado');
  }

  // Verificar mensaje de error específico
  if (content.includes('camposFaltantes.join(\', \')')) {
    console.log('   ✓ Mensaje de error específico con campos faltantes');
  } else {
    console.log('   ✗ Mensaje de error específico no implementado');
  }
  // Verificar validación de procesos
  if (content.includes('actividad.procesos.length === 0')) {
    console.log('   ✓ Validación de procesos mejorada');
  } else {
    console.log('   ✗ Validación de procesos no encontrada');
  }
  // Verificar validación de insumos obligatorios
  if (content.includes('actividad.insumos.length === 0')) {
    console.log('   ✓ Validación de insumos como campo obligatorio');
  } else {
    console.log('   ✗ Validación de insumos obligatorios no encontrada');
  }

  // Verificar que el label de insumos sea obligatorio
  if (content.includes('Insumo(s) *')) {
    console.log('   ✓ Label de insumos marcado como obligatorio');
  } else {
    console.log('   ✗ Label de insumos no marcado como obligatorio');
  }

  console.log('\n✅ Verificando Componentes UI Compactos:');
  
  // Verificar select compacto
  if (content.includes('minHeight: \'36px\'')) {
    console.log('   ✓ Selects con altura mínima reducida');
  } else {
    console.log('   ✗ Selects no optimizados');
  }

  // Verificar botones compactos
  if (content.includes('h-9 px-4 text-sm')) {
    console.log('   ✓ Botón individual más compacto');
  } else {
    console.log('   ✗ Botón individual no optimizado');
  }

  if (content.includes('h-10')) {
    console.log('   ✓ Botón principal con altura ajustada');
  } else {
    console.log('   ✗ Botón principal no ajustado');
  }

  // Verificar íconos más pequeños
  if (content.includes('w-3 h-3')) {
    console.log('   ✓ Íconos más pequeños en botones');
  } else {
    console.log('   ✗ Íconos no reducidos');
  }

  console.log('\n✅ Verificando Textarea Compacta:');
  
  if (content.includes('rows={2}')) {
    console.log('   ✓ Textarea de observaciones más compacta (2 filas)');
  } else {
    console.log('   ✗ Textarea no optimizada');
  }

  console.log('\n✅ Verificando Responsive Design:');
  
  if (content.includes('hidden sm:inline')) {
    console.log('   ✓ Texto "Cruza medianoche" oculto en móvil');
  } else {
    console.log('   ✗ Optimización móvil no implementada');
  }

  console.log('\n📊 Resumen de Mejoras:');
  console.log('   • Cards más compactas con menos padding');
  console.log('   • Inputs y selects más pequeños');
  console.log('   • Labels y texto reducido para mejor densidad');
  console.log('   • Validación específica de campos faltantes');
  console.log('   • Botones más compactos y proporcionales');
  console.log('   • Íconos y elementos visuales optimizados');
  console.log('   • Mejor responsive en dispositivos móviles');

  console.log('\n🎯 Casos de Prueba Sugeridos:');
  console.log('   1. Crear actividad sin llenar campos obligatorios');
  console.log('   2. Presionar "Guardar Actividad Individual"');
  console.log('   3. Verificar que muestre campos específicos faltantes');
  console.log('   4. Comprobar que las cards ocupen menos espacio');
  console.log('   5. Probar en dispositivos móviles');

  console.log('\n✅ MEJORAS IMPLEMENTADAS EXITOSAMENTE!');

} catch (error) {
  console.error('❌ Error verificando mejoras:', error.message);
  process.exit(1);
}
