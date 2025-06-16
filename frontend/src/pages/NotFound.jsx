import React from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para la navegación interna

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 p-4">
      {/* Icono visual para indicar que algo no se encontró */}
      {/* Usamos un SVG para que sea escalable y ligero */}
      <svg
        className="w-24 h-24 text-blue-600 mb-6" // Color de tu marca para coherencia
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" // Icono de exclamación
        ></path>
      </svg>

      {/* Título principal del error */}
      <h1 className="text-5xl font-extrabold mb-4">404</h1>
      
      {/* Mensaje descriptivo */}
      <p className="text-xl md:text-2xl text-center mb-8 font-semibold">
        ¡Oops! Página no encontrada.
      </p>
      
      {/* Explicación adicional */}
      <p className="text-md md:text-lg text-center mb-10 max-w-md">
        Parece que la dirección a la que intentaste acceder no existe o ha sido movida.
      </p>

      {/* Botón para volver a la página de inicio */}
      {/* Utilizamos Link para una navegación SPA (Single Page Application) */}
      <Link
        to="/" // Redirige a la ruta raíz de tu aplicación (normalmente el login o dashboard inicial)
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
      >
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFound;