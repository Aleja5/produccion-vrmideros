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
  OTIs: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};

// Componente para tarjetas KPI
const ResumenKPI = ({ title, value, icon, bgColor, textColor }) => {
  return (
    <Card className={`${bgColor} p-6 rounded-xl shadow-md transition-transform transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-600">{title}</h3>
          <p className={`text-2xl font-bold ${textColor} mt-2`}>{value}</p>
        </div>
        <div className="bg-white p-3 rounded-full shadow-sm">{icon}</div>
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operario</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Inicio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Fin</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jornadas.map((jornada) => (
            <tr key={jornada._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {jornada.operario?.name || 'Sin asignar'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {ajustarFechaLocal(jornada.fecha).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {jornada.horaInicio ? new Date(jornada.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {jornada.horaFin ? new Date(jornada.horaFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="font-medium text-green-600">
                  {jornada.totalTiempoActividades?.horas || 0}h {jornada.totalTiempoActividades?.minutos || 0}m
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={() => navigate(`/admin/jornada/${jornada._id}`)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
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
    otisActivas: 0
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
      <div className="flex bg-gray-100 min-h-screen">
        <SidebarAdmin />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
              <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión de producción</p>
            </div>

            {/* Tarjetas KPI */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Resumen del día</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Jornadas Recientes</h2>
                <button 
                  onClick={() => navigate('/admin-dashboard')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
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
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/operarios')}
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <span className="mr-2">👥</span>
                  Gestionar Operarios
                </button>
                <button
                  onClick={() => navigate('/admin/procesos')}
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <span className="mr-2">⚙️</span>
                  Gestionar Procesos
                </button>
                <button
                  onClick={() => navigate('/admin/maquinas')}
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <span className="mr-2">🔧</span>
                  Gestionar Máquinas
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
