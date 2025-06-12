import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import axiosInstance from "../utils/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { toast } from "react-toastify";
import { Button, Card } from "../components/ui";
import { Sidebar } from "../components/Sidebar";
import EditarProduccion from "./EditarProduccion"; 
import { Pencil, Trash2 } from "lucide-react"; // Importing icons

const ajustarFechaLocal = (fechaUTC) => {
  // Crear una nueva fecha basada en la fecha UTC recibida
  // pero interpretada como fecha local para evitar problemas de zona horaria
  const fecha = new Date(fechaUTC);
  const year = fecha.getUTCFullYear();
  const month = fecha.getUTCMonth();
  const day = fecha.getUTCDate();
  // Crear fecha local con los componentes UTC para evitar desfase de zona horaria
  return new Date(year, month, day);
};

const MiJornada = () => {
  const [jornadaActual, setJornadaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState(null); 
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  
  const storedOperario = JSON.parse(localStorage.getItem('operario'));
  const operarioName = storedOperario?.name || 'Operario';

  
  const fetchJornadas = useCallback(async () => {
    try {
      setLoading(true);
      const localStoredOperario = JSON.parse(localStorage.getItem("operario"));
      if (!localStoredOperario || !localStoredOperario._id) {
        toast.error("No se encontró información del operario. Por favor, inicie sesión nuevamente.");
        navigate("/validate-cedula");
        return;
      }
      const operarioId = localStoredOperario._id;
      const response = await axiosInstance.get(`/jornadas/operario/${operarioId}`);
      const jornadas = response.data;
      console.log("Todas las jornadas recibidas:", jornadas);      const currentJornada = jornadas.find((jornada) => {
        const fechaJornada = ajustarFechaLocal(jornada.fecha).toDateString();
        // Usar fecha actual local sin ajustes de zona horaria
        const today = new Date();
        const fechaHoy = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
        return fechaJornada === fechaHoy;
      });
      console.log("Jornada actual encontrada:", currentJornada); 
      setJornadaActual(currentJornada);
    } catch (error) {
      console.error("Error al obtener la jornada actual:", error);
      toast.error("No se pudo cargar la jornada actual.");
    } finally {
      setLoading(false);
    }
  }, [navigate]); // useCallback dependencies remain the same

  useEffect(() => {
    fetchJornadas();
  }, [fetchJornadas, location]); // Add location to the dependency array


  const handleEditarActividad = (actividad) => {
    setSelectedActividad(actividad); 
    setIsEditModalOpen(true);
  };
  const handleEliminarActividad = async (actividadId) => {
    try {
      console.log(`Intentando eliminar actividad con ID: ${actividadId}`);
      
      // 1. Eliminar la actividad
      const response = await axiosInstance.delete(`/produccion/eliminar/${actividadId}`);
      console.log("Respuesta de eliminación:", response.data);
      
      toast.success("Actividad eliminada con éxito");
      // No es necesario actualizar localmente los registros si vamos a re-fetchear toda la jornada
      // setJornadaActual((prev) => ({
      //   ...prev,
      //   registros: prev.registros.filter((registro) => registro._id !== actividadId),
      // }));
      await fetchJornadas(); // Re-fetch jornada data to show updated totals and details
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);
      toast.error("No se pudo eliminar la actividad.");
    }
  };

  return (
  <div className="flex bg-gray-100 h-screen">
    <Sidebar />
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 max-w-7xl">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Mi Jornada Actual</h1>
            <p className="text-md text-gray-500">
              Bienvenido, <span className="font-semibold">{operarioName}</span>
            </p>
          </div>
          <Button
            onClick={() => navigate("/registro-produccion")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300"
          >
            Agregar actividad
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-lg text-gray-600">Cargando información de la jornada...</p>
          </div>
        ) : jornadaActual && jornadaActual.registros && jornadaActual.registros.length > 0 ? (
          <>
            <Card className="mb-6 bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 border-gray-300">Detalles de la Jornada</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700">
                  <div><strong>Fecha:</strong> {ajustarFechaLocal(jornadaActual.fecha).toLocaleDateString()}</div>                  
                  <div><strong>Tiempo Total:</strong> {jornadaActual.totalTiempoActividades && typeof jornadaActual.totalTiempoActividades.horas === 'number' && typeof jornadaActual.totalTiempoActividades.minutos === 'number' ? `${jornadaActual.totalTiempoActividades.horas}h ${jornadaActual.totalTiempoActividades.minutos}m` : (jornadaActual.totalTiempoActividades || 'N/A')}</div>
                  <div><strong>Inicio de Jornada:</strong> {jornadaActual.horaInicio ? new Date(jornadaActual.horaInicio).toLocaleTimeString() : 'N/A'}</div>
                  <div><strong>Fin de Jornada:</strong> {jornadaActual.horaFin ? new Date(jornadaActual.horaFin).toLocaleTimeString() : 'N/A'}</div>
                </div>
              </div>
            </Card>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 border-b pb-2 border-gray-300">
              Actividades Registradas
            </h2>

            <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Proceso</th>                    
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">OTI</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Área</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Máquina</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Insumos</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo Tiempo</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">H. Inicio</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">H. Fin</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tiempo (min)</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Observaciones</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {jornadaActual.registros
                    .sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio))
                    .map((actividad) => (
                      <tr key={actividad._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {actividad.procesos && actividad.procesos.length > 0 ? (
                            actividad.procesos.map(p => <div key={p._id || p.nombre}>{p.nombre}</div>)
                          ) : (
                            "N/A"
                          )}
                        </td>                        
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.oti?.numeroOti || "N/A"}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.areaProduccion?.nombre || "N/A"}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.maquina?.nombre || "N/A"}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {actividad.insumos && actividad.insumos.length > 0 ? (
                            actividad.insumos.map(i => <div key={i._id || i.nombre}>{i.nombre}</div>)
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.tipoTiempo || "N/A"}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{actividad.tiempo}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs whitespace-normal break-words">{actividad.observaciones || "N/A"}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEditarActividad(actividad)}
                            className="bg-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-md shadow-md hover:bg-green-300 transition-all duration-300 cursor-pointer text-xs"
                            title="Editar"
                          >
                            <Pencil size={14} className="inline mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
                                handleEliminarActividad(actividad._id);
                              }
                            }}
                            className="bg-red-200 text-red-700 font-semibold px-3 py-1.5 rounded-md shadow-md hover:bg-red-300 transition-all duration-300 cursor-pointer ml-2 text-xs"
                            title="Eliminar"
                          >
                            <Trash2 size={14} className="inline mr-1" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 text-center bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">¡Hola, {operarioName}!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Parece que no tienes una jornada activa registrada para hoy.
            </p>
            <Button
              onClick={() => navigate("/registro-produccion")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300"
            >
              <span className="flex items-center space-x-2">
                <span>Comenzar Nueva Jornada</span>
              </span>
            </Button>
          </Card>
        )}
      </div>
    </div>
    
    {/* MODAL FOR EDITING PRODUCCION */}
    {isEditModalOpen && selectedActividad && (
      <EditarProduccion
        produccion={selectedActividad}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedActividad(null);
        }}
        onGuardar={() => {
          setIsEditModalOpen(false);
          setSelectedActividad(null);
          fetchJornadas(); // Re-fetch jornada data to show updated info
        }}
      />
    )}
  </div>
  </div>
);

};

export default MiJornada;

