require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function probarEndpointsJornadas() {
  try {
    console.log('🔌 Probando endpoints de jornadas...');
    
    const baseURL = 'http://localhost:3000/api';
    
    // Probar endpoint de jornadas de operario
    console.log('\n1. Probando jornadas por operario (Alejandra)...');
    const alejandraId = '681cebe0ef109ebe9e4f87de';
    
    try {
      const response = await axios.get(`${baseURL}/jornadas/operario/${alejandraId}`);
      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ Jornadas encontradas: ${response.data.length}`);
      
      for (const jornada of response.data) {
        console.log(`   📅 Fecha: ${new Date(jornada.fecha).toLocaleDateString()}`);
        console.log(`   📋 Registros: ${jornada.registros ? jornada.registros.length : 0}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response ? error.response.status : error.message}`);
    }
    
    // Probar endpoint de dashboard
    console.log('\n2. Probando dashboard...');
    try {
      const response = await axios.get(`${baseURL}/dashboard`);
      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ Dashboard data:`, Object.keys(response.data));
    } catch (error) {
      console.log(`❌ Error: ${error.response ? error.response.status : error.message}`);
    }
    
    // Probar endpoint de producciones
    console.log('\n3. Probando producciones...');
    try {
      const response = await axios.get(`${baseURL}/production`);
      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ Producciones encontradas: ${response.data.length}`);
      
      // Buscar producciones de Alejandra
      const produccionesAlejandra = response.data.filter(p => 
        p.operario && (p.operario._id === alejandraId || p.operario.toString() === alejandraId)
      );
      console.log(`✅ Producciones de Alejandra: ${produccionesAlejandra.length}`);
    } catch (error) {
      console.log(`❌ Error: ${error.response ? error.response.status : error.message}`);
    }
    
    console.log('\n✅ Pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

probarEndpointsJornadas();
