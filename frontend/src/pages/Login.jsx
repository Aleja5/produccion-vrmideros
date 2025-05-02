import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { BeatLoader } from 'react-spinners';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import logo from '../assets/2.png';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      // Hacemos la petición POST al backend para el login
      const response = await axiosInstance.post('/auth/login', { email, password });

      // Si la respuesta tiene un token y usuario, lo guardamos en el localStorage
      const { token, user, redirect } = response.data;

      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('idOperario', user._id);
        
        // Redirigimos al usuario a la página correspondiente
        setTimeout(() => navigate(redirect), 100);
      } else {
        setError('No se pudieron recuperar las credenciales');
      }

    } catch (err) {
      // Gestionamos errores y mostramos un mensaje
      if (err.response) {
        setError(err.response.data.message || 'Credenciales inválidas');
      } else if (err.request) {
        setError('No se pudo conectar con el servidor');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <div className="hidden md:flex w-1/2 items-center justify-center p-10">
        <img src={logo} alt="Logo Mideros" className="w-full max-w-md animate-fade-in" />
      </div>

      <div className="flex flex-col justify-center w-full md:w-1/2 p-8 md:p-20">
        <h1 className="text-4xl font-bold mb-6 text-white text-center">Bienvenido a VR MIDEROS</h1>
        <p className="text-center text-gray-400 mb-6">Ingresa tus credenciales para continuar</p>

        {error && <div className="text-red-500 text-sm text-center mb-4 animate-pulse">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              className="w-full pl-10 pr-12 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex justify-center"
          >
            {loading ? <BeatLoader size={8} color="#fff" /> : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-blue-400 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
