import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { Card } from '../components/ui';
import { ClipboardList, UserCircle, Clock, Calendar, ChevronLeft } from 'lucide-react';

const ajustarFechaLocal = (fechaUTC) => {
  const fecha = new Date(fechaUTC);
  return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

const badge = (text, color) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-${color}-100 text-${color}-700 mr-2 mb-1`}>{text}</span>
);

const AdminJornadaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jornada, setJornada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJornada = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/jornadas/${id}`);
        setJornada(response.data);
      } catch (err) {
        setError('No se pudo cargar la jornada.');
        toast.error('No se pudo cargar la jornada.');
      } finally {
        setLoading(false);
      }
    };
    fetchJornada();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }
  if (error || !jornada) {
    return <div className="flex justify-center items-center h-64 text-red-600">{error || 'No se encontró la jornada.'}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="flex bg-gray-100 min-h-screen">
        <SidebarAdmin />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto"> {/* Aumentado el max-w para la tabla */}
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-indigo-600 hover:underline font-medium">
              <ChevronLeft className="w-5 h-5 mr-1" /> Volver
            </button>
            {/* Detalles de la Jornada - Se mantiene el diseño actual */}
            <Card className="p-8 mb-8 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <div className="flex items-center mb-4">
                <ClipboardList className="w-8 h-8 text-indigo-500 mr-3" />
                <h1 className="text-3xl font-bold text-gray-800">Detalle de Jornada</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <div className="flex items-center mb-2 text-gray-700">
                    <UserCircle className="w-5 h-5 mr-2 text-blue-400" />
                    <span className="font-semibold">Operario:</span> {jornada.operario?.name || 'Sin asignar'}
                  </div>
                  <div className="flex items-center mb-2 text-gray-700">
                    <Calendar className="w-5 h-5 mr-2 text-green-400" />
                    <span className="font-semibold">Fecha:</span> {ajustarFechaLocal(jornada.fecha).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-2 text-gray-700">
                    <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                    <span className="font-semibold">Hora Inicio:</span> {jornada.horaInicio ? new Date(jornada.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </div>
                  <div className="flex items-center mb-2 text-gray-700">
                    <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                    <span className="font-semibold">Hora Fin:</span> {jornada.horaFin ? new Date(jornada.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </div>
                  <div className="flex items-center mb-2 text-gray-700">
                    <Clock className="w-5 h-5 mr-2 text-green-500" />
                    <span className="font-semibold">Tiempo Total:</span> {jornada.totalTiempoActividades?.horas || 0}h {jornada.totalTiempoActividades?.minutos || 0}m
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Actividades Registradas - Nuevo diseño de tabla */}
            <Card className="shadow-lg border border-gray-200 bg-white rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold flex items-center text-gray-700">
                  <ClipboardList className="w-6 h-6 mr-2 text-blue-600" /> Actividades Registradas
                </h2>
              </div>
              {jornada.registros && jornada.registros.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Proceso</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">OTI</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Área</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Máquina</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">H. Inicio</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">H. Fin</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jornada.registros.map((actividad) => (
                        <tr key={actividad._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {actividad.procesos?.map(p => p.nombre).join(', ') || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actividad.oti?.numeroOti || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actividad.areaProduccion?.nombre || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{actividad.maquina?.nombre || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 p-6">No hay actividades registradas.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminJornadaDetalle;
