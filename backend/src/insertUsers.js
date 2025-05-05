const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/localproduccion';
const dbName = 'localproduccion';

async function insertUser(email, password, role) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el usuario
    await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      role,
    });

    console.log(`Usuario ${email} insertado correctamente.`);

    return { email, password, hashedPassword }; // Retornar datos para la verificación
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Función para verificar la contraseña después de la inserción
async function verificarPassword(email, password) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Buscar el usuario por email
    const users = await db.collection('users').findOne({ email });

    if (!users) {
      console.log('Usuario no encontrado.');
      return;
    }

    console.log('Contraseña ingresada:', password);
    console.log('Contraseña almacenada en BD:', users.password);

    // Comparar la contraseña ingresada con la almacenada
    const isMatch = await bcrypt.compare(password, users.password);
    console.log('¿Coincide?', isMatch);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Insertar usuario y luego verificar la contraseña
(async () => {
  await insertUser('alejandra1308castellanos@gmail.com', '123456', 'admin');
  await verificarPassword('alejandra1308castellanos@gmail.com', '123456');
})();
