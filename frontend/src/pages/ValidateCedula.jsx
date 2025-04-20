import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { IdCard } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/2.png';

const ValidateCedula = () => {
  const [cedula, setCedula] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Eliminar todos los datos relevantes del almacenamiento local
    localStorage.clear();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const storedToken = localStorage.getItem('token');
      const config = storedToken ? { headers: { Authorization: `Bearer ${storedToken}` } } : {};

      const response = await axiosInstance.post('operator/validate-cedula', { cedula }, config);
      const { operario, token } = response.data;

      if (!operario || (!operario.id && !operario._id)) {
        setMessage('Datos del operario incompletos');
        return;
      }

      localStorage.setItem('operario', JSON.stringify({
        _id: operario._id || operario.id,
        name: operario.name,
        cedula: operario.cedula
      }));

      if (token) {
        localStorage.setItem('token', token);
      }

      setTimeout(() => {
        navigate('/operario-dashboard');
      }, 500);
    } catch (error) {
      console.error('Error al validar cédula:', error.response?.data || error.message);
      setMessage('Cédula inválida o no encontrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Lado izquierdo con logo */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-10">
        <img src={logo} alt="Logo Mideros" className="w-3/4 max-w-sm animate-fade-in" />
      </div>

      {/* Botón de cerrar sesión */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Formulario */}
      <div className="flex w-full md:w-1/2 justify-center items-center px-6 md:px-16">
        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Identificación</h1>

          <div className="relative mb-6">
            <IdCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ingrese su cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex justify-center"
          >
            {loading ? 'Cargando...' : 'Validar Cédula'}
          </button>

          {message && <p className="mt-4 text-sm text-red-500 text-center">{message}</p>}
        </motion.form>
      </div>
    </div>
  );
};

export default ValidateCedula;