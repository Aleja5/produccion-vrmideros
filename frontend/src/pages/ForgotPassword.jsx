import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Asegúrate de que este archivo esté bien configurado
import { Mail } from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar posibles errores previos
    setMessage(''); // Limpiar mensaje previo
    setLoading(true); // Activar el spinner

    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });

      if (res.data.message) {
        setMessage(res.data.message); // Mensaje de éxito
        setEmail(''); // Limpiar el campo de correo después de enviar el mensaje
      } else {
        setMessage('Correo enviado. Revisa tu bandeja de entrada.');
        setEmail('');
      }
    } catch (err) {
      console.error(err); // Depuración del error
      if (err.response) setError(err.response.data.message || 'Error al enviar el correo');
      else setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false); // Desactivar el spinner
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-4 text-center">¿Olvidaste tu contraseña?</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {/* Mostrar mensaje de éxito o error */}
        {message && <div className="text-green-500 text-sm text-center mb-4">{message}</div>}
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}

        {/* Formulario de recuperación */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Correo electrónico"
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading || !email} // Deshabilitar si está cargando o el email está vacío
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex justify-center"
          >
            {loading ? <BeatLoader size={8} color="#fff" /> : 'Enviar correo'}
          </button>
        </form>

        {/* Enlace para volver al inicio de sesión */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-400 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
