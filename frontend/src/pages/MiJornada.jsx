import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Card } from "../components/ui";
import { Sidebar } from "../components/Sidebar";

const ajustarFechaLocal = (fechaUTC) => {
  const fecha = new Date(fechaUTC);
  return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

const MiJornada = () => {
  const [jornadaActual, setJornadaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const storedOperario = JSON.parse(localStorage.getItem('operario'));
  const operarioName = storedOperario?.name || 'Operario';

  useEffect(() => {
    const fetchJornadas = async () => {
      try {
        setLoading(true);

        
        const storedOperario = JSON.parse(localStorage.getItem("operario"));
        if (!storedOperario || !storedOperario._id) {
          toast.error("No se encontró información del operario. Por favor, inicie sesión nuevamente.");
          navigate("/validate-cedula");
          return;
        }

        const operarioId = storedOperario._id;
        const response = await axiosInstance.get(`/jornadas/operario/${operarioId}`);
        const jornadas = response.data;

        console.log("Jornadas fetched:", jornadas); // Debugging log

        const jornadaActual = jornadas.find((jornada) => {
          const fechaJornada = ajustarFechaLocal(jornada.fecha).toDateString();
          const fechaHoy = ajustarFechaLocal(new Date()).toDateString();
          console.log("Comparing:", { fechaJornada, fechaHoy }); 
          return fechaJornada === fechaHoy;
        });

        console.log("Jornada actual identified:", jornadaActual); // Debugging log

        setJornadaActual(jornadaActual);
      } catch (error) {
        console.error("Error al obtener la jornada actual:", error);
        toast.error("No se pudo cargar la jornada actual.");
      } finally {
        setLoading(false);
      }
    };

    fetchJornadas();
  }, [navigate]);


  const handleEditarActividad = (actividadId) => {
    navigate(`/produccion/actualizar/${actividadId}`);
  };
  const handleEliminarActividad = async (actividadId) => {
    try {
      console.log(`Intentando eliminar actividad con ID: ${actividadId}`);
      
      // 1. Eliminar la actividad
      const response = await axiosInstance.delete(`/produccion/eliminar/${actividadId}`);
      console.log("Respuesta de eliminación:", response.data);
      
      toast.success("Actividad eliminada con éxito");
      setJornadaActual((prev) => ({
        ...prev,
        registros: prev.registros.filter((registro) => registro._id !== actividadId),
      }));
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);
      toast.error("No se pudo eliminar la actividad.");
    }
  };

  return (
  <div className="flex bg-gray-100 h-screen">
    <Sidebar />
    <div className="flex-1 overflow-auto">
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
        ) : jornadaActual ? (
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

            {jornadaActual.registros && jornadaActual.registros.length > 0 ? (
              jornadaActual.registros.map((actividad) => (
                <Card
                  key={actividad._id}
                  className="mb-4 bg-white rounded-xl border hover:shadow-md transition-all"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-blue-700">
                          {actividad.proceso?.nombre || "Proceso no especificado"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Tiempo: <span className="text-green-600 font-semibold">{actividad.tiempo} min</span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEditarActividad(actividad._id)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm rounded-md"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleEliminarActividad(actividad._id)}
                          className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-200"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      {actividad.oti?.numeroOti && (
                        <p><span className="font-semibold">OTI:</span> {actividad.oti.numeroOti}</p>
                      )}
                      {actividad.areaProduccion?.nombre && (
                        <p><span className="font-semibold">Área:</span> {actividad.areaProduccion.nombre}</p>
                      )}
                      {actividad.maquina?.nombre && (
                        <p><span className="font-semibold">Máquina:</span> {actividad.maquina.nombre}</p>
                      )}
                      {actividad.insumos?.nombre && (
                        <p><span className="font-semibold">Insumos:</span> {actividad.insumos.nombre}</p>
                      )}
                      {actividad.tipoTiempo && (
                        <p><span className="font-semibold">Tipo:</span> {actividad.tipoTiempo}</p>
                      )}
                      {(actividad.horaInicio || actividad.horaFin) && (
                        <p className="md:col-span-2 lg:col-span-1">
                          <span className="font-semibold">Horario:</span>{" "}
                          {actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} -{" "}
                          {actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                      )}
                    </div>

                    {actividad.observaciones && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                        <span className="font-semibold">Observaciones:</span> {actividad.observaciones}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-gray-600">No hay actividades registradas.</p>
            )}
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
  </div>
);

};

export default MiJornada;

