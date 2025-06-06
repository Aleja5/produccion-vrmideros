import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { SidebarAdmin } from '../components/SidebarAdmin';
import Navbar from '../components/Navbar';
import { Card } from '../components/ui';

// Iconos para las tarjetas KPI
const KpiIcons = {
  Jornadas: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Minutos: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Registros: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

// Componente para tarjetas KPI
const ResumenKPI = ({ title, value, icon, bgColor, textColor }) => {
  return (
    <Card className={`${bgColor} p-6 rounded-2xl shadow-lg transition-transform transform hover:scale-105 border border-gray-200`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-700 tracking-wide uppercase">{title}</h3>
          <p className={`text-3xl font-extrabold ${textColor} mt-2 drop-shadow-sm`}>{value}</p>
        </div>
        <div className="bg-white p-4 rounded-full shadow-md border border-gray-100 flex items-center justify-center"></div>
      </div>
    </Card>
  );
};

// Componente para tabla de jornadas recientes
const TablaJornadasRecientes = ({ jornadas, loading, navigate }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500">Cargando jornadas recientes...</p>
      </div>
    );
  }

  if (!jornadas || jornadas.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-lg shadow">
        <p className="text-gray-500">No hay jornadas recientes para mostrar</p>
      </div>
    );
  }

  // Filtrar jornadas que tengan al menos una actividad (registros)
  const jornadasConActividades = jornadas.filter(j => Array.isArray(j.registros) && j.registros.length > 0);

  if (jornadasConActividades.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-lg shadow">
        <p className="text-gray-500">No hay jornadas recientes con actividades para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Operario</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Hora Inicio</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Hora Fin</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiempo Total</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jornadasConActividades.map((jornada, idx) => (
            <tr key={jornada._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-blue-50 transition-colors"}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {jornada.operario?.name || 'Sin asignar'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(jornada.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {jornada.horaInicio ? new Date(jornada.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {jornada.horaFin ? new Date(jornada.horaFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                {jornada.totalTiempoActividades?.horas || 0}h {jornada.totalTiempoActividades?.minutos || 0}m
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={() => navigate(`/admin/jornada/${jornada._id}`)}
                  className="text-indigo-600 hover:text-indigo-900 font-semibold px-3 py-1 rounded transition-colors bg-indigo-50 hover:bg-indigo-100"
                >
                  Ver detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ajustarFechaLocal = (fechaUTC) => {
  const fecha = new Date(fechaUTC);
  return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

const AdminHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    jornadasHoy: 0,
    minutosHoy: 0,
    registrosHoy: 0,
  });
  const [jornadasRecientes, setJornadasRecientes] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Obtener resumen de KPIs
        const kpiResponse = await axiosInstance.get('/admin/dashboard/kpi');
        setKpis(kpiResponse.data);

        // Obtener jornadas recientes
        const jornadasResponse = await axiosInstance.get('/jornadas?limit=5&sort=fecha:desc');
        setJornadasRecientes(jornadasResponse.data);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        toast.error("No se pudieron cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Actualizar los datos cada 5 minutos
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
      <div className="flex bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 h-screen">
        <SidebarAdmin />
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Encabezado */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Panel de Administración</h1>
                <p className="text-lg text-gray-500 mt-2">Bienvenido al sistema de gestión de producción</p>
              </div>
              <img src="/src/assets/logo.png" alt="Logo" className="h-16 w-auto hidden md:block" />
            </div>

            {/* Tarjetas KPI */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-700 mb-6 tracking-tight">Resumen del día</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <ResumenKPI 
                  title="Jornadas Activas" 
                  value={loading ? "..." : kpis.jornadasHoy} 
                  icon={KpiIcons.Jornadas}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
                />
                <ResumenKPI 
                  title="Minutos Trabajados" 
                  value={loading ? "..." : `${kpis.minutosHoy} min`} 
                  icon={KpiIcons.Minutos}
                  bgColor="bg-green-50"
                  textColor="text-green-600"
                />
                <ResumenKPI 
                  title="Registros Hoy" 
                  value={loading ? "..." : kpis.registrosHoy} 
                  icon={KpiIcons.Registros}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
                />
              </div>
            </section>

            {/* Jornadas Recientes */}
            <section className="mb-12">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-700 tracking-tight">Jornadas Recientes</h2>
                <button 
                  onClick={() => navigate('/admin-dashboard')}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-base font-semibold"
                >
                  Ver todas
                </button>
              </div>
              <TablaJornadasRecientes 
                jornadas={jornadasRecientes} 
                loading={loading} 
                navigate={navigate}
              />
            </section>

            {/* Botones de Acceso Rápido */}
            <section>
              <h2 className="text-2xl font-bold text-gray-700 mb-6 tracking-tight">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <button
                  onClick={() => navigate('/admin/operarios')}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-md hover:shadow-lg transition-all border border-blue-200 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</span>
                  <span className="font-bold text-blue-800 text-lg">Gestionar Operarios</span>
                </button>
                <button
                  onClick={() => navigate('/admin/procesos')}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl shadow-md hover:shadow-lg transition-all border border-purple-200 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</span>
                  <span className="font-bold text-purple-800 text-lg">Gestionar Procesos</span>
                </button>
                <button
                  onClick={() => navigate('/admin/maquinas')}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl shadow-md hover:shadow-lg transition-all border border-green-200 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔧</span>
                  <span className="font-bold text-green-800 text-lg">Gestionar Máquinas</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminHome;
