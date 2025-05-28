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
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-indigo-600 hover:underline font-medium">
              <ChevronLeft className="w-5 h-5 mr-1" /> Volver
            </button>
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
            <Card className="p-8 shadow-lg border border-gray-100 bg-white">
              <h2 className="text-2xl font-bold mb-8 flex items-center text-[#2a2d34] tracking-tight border-b pb-2 border-blue-200">
                <ClipboardList className="w-6 h-6 mr-2 text-blue-700" /> Actividades
              </h2>
              {jornada.registros && jornada.registros.length > 0 ? (
                <ul className="space-y-8">
                  {jornada.registros.map((actividad, idx) => (
                    <li key={actividad._id} className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-7 shadow-md hover:shadow-lg transition-all">
                      {/* Título de la actividad: nombre del proceso */}
                      <h3 className="text-2xl font-extrabold text-blue-900 mb-5 tracking-tight leading-tight">
                        {actividad.proceso?.nombre || 'Sin proceso'}
                      </h3>
                      {/* Grupo 1: OTI y Área */}
                      <div className="flex flex-col md:flex-row gap-4 mb-2 items-center">
                        <div className="flex items-center bg-[#F3F4F6] rounded-lg px-4 py-2 min-w-[180px]">
                          <ClipboardList className="w-5 h-5 text-[#4B5563] mr-2" />
                          <span className="font-semibold text-[#4B5563]">OTI:</span>
                          <span className="ml-1 text-[#4B5563]">{actividad.oti?.numeroOti || 'N/A'}</span>
                        </div>
                        <div className="flex items-center bg-[#DBEAFE] rounded-lg px-4 py-2 min-w-[180px]">
                          <UserCircle className="w-5 h-5 text-[#2563EB] mr-2" />
                          <span className="font-semibold text-[#2563EB]">Área:</span>
                          <span className="ml-1 text-[#2563EB]">{actividad.areaProduccion?.nombre || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Grupo 2: Insumos y Máquina */}
                      <div className="flex flex-col md:flex-row gap-4 mb-2 items-center">
                        <div className="flex items-center bg-[#FFEDD5] rounded-lg px-4 py-2 min-w-[180px]">
                          <ClipboardList className="w-5 h-5 text-[#EA580C] mr-2" />
                          <span className="font-semibold text-[#EA580C]">Insumos:</span>
                          <span className="ml-1 text-[#EA580C]">{actividad.insumos?.nombre || 'N/A'}</span>
                        </div>
                        <div className="flex items-center bg-[#DBEAFE] rounded-lg px-4 py-2 min-w-[180px]">
                          <Clock className="w-5 h-5 text-[#1E3A8A] mr-2" />
                          <span className="font-semibold text-[#1E3A8A]">Máquina:</span>
                          <span className="ml-1 text-[#1E3A8A]">{actividad.maquina?.nombre || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Grupo 3: Horario y Tiempo */}
                      <div className="flex flex-col md:flex-row gap-4 mb-2 items-center">
                        <div className="flex items-center bg-[#FEF3C7] rounded-lg px-4 py-2 min-w-[180px]">
                          <Clock className="w-5 h-5 text-[#FBBF24] mr-2" />
                          <span className="font-semibold text-[#FBBF24]">Horario:</span>
                          <span className="ml-1 text-[#FBBF24]">{actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center bg-[#FECACA] rounded-lg px-4 py-2 min-w-[180px]">
                          <Clock className="w-5 h-5 text-[#B91C1C] mr-2" />
                          <span className="font-semibold text-[#B91C1C]">Tiempo:</span>
                          <span className="ml-1 text-[#B91C1C]">{actividad.tiempo || 0} min</span>
                        </div>
                      </div>
                      {/* Grupo 4: Tipo de tiempo */}
                      <div className="flex flex-col md:flex-row gap-4 mb-2 items-center">
                        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 min-w-[180px]">
                          <ClipboardList className="w-5 h-5 text-gray-500 mr-2" />
                          <span className="font-semibold text-gray-900">Tipo:</span>
                          <span className="ml-1 text-gray-800">{actividad.tipoTiempo || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Observaciones */}
                      <div className="border-t border-blue-100 pt-3 mt-3 text-gray-700 text-base">
                        <span className="font-semibold text-blue-700">Observaciones:</span> {actividad.observaciones || 'N/A'}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay actividades registradas.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminJornadaDetalle;
