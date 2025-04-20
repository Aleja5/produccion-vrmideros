const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/localproduccion';
const dbName = 'localproduccion';

async function insertProduccion(oti, maquina, proceso, areaProduccion, operario, tiempoPreparacion, tiempoOperacion, fecha) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const nuevaProduccion = {
      oti,
      maquina,
      proceso,
      areaProduccion,
      operario,
      tiempoPreparacion,
      tiempoOperacion,
      fecha: fecha || new Date() // Usa la fecha actual si no se proporciona
    };

    await db.collection('registroProduccion').insertOne(nuevaProduccion);

    console.log(`Producción insertada correctamente.`);
  } catch (error) {
    console.error('Error al insertar producción:', error);
  } finally {
    await client.close();
  }
}


insertProduccion(
  '3456', 
  'Torno CNC',
  'Mecanizado',
  'Área de mecanizado',
  'Alejandra Castellanos',
  15,  // Tiempo de preparación en minutos
  60   // Tiempo de operación en minutos
);
