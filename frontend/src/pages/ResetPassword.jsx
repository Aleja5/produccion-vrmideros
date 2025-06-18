import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

function ResetPassword() {
  const { token } = useParams(); // Obtenemos el token de la URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado para manejar la carga

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Token recibido desde URL:', token);
    console.log('Nueva contraseña ingresada:', newPassword);
    console.log('Confirmación de contraseña:', confirmPassword);

    // Validación de contraseñas
    if (newPassword !== confirmPassword) {
      console.log('Error: las contraseñas no coinciden');
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      console.log('Error: contraseña demasiado corta');
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);    try {
      const res = await axios.post(buildApiUrl('api/auth/reset-password'), {
        token,
        newPassword,
      });

      console.log('Respuesta del backend:', res.data);
      setMensaje(res.data.message);
      setError('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error al enviar la nueva contraseña:', err);
      console.log(err.response?.data);

      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
      setMensaje('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">

      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Restablecer Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
            />
          </div>
          {mensaje && <p className="text-green-500 text-sm mb-4">{mensaje}</p>}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex justify-center"
          >
            {loading ? 'Cargando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
