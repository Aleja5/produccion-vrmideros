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
          console.log("Comparing:", { fechaJornada, fechaHoy }); // Debugging log
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
    navigate(`/editar-actividad/${actividadId}`);
  };

  const handleEliminarActividad = async (actividadId) => {
    try {
      await axiosInstance.delete(`/produccion/eliminar/${actividadId}`);
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

  if (loading) return <p>Cargando jornada actual...</p>;

  return (
    <div className="flex bg-gray-100 h-screen">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Mi Jornada Actual</h1>

          {jornadaActual ? (
            <Card className="mb-6">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">Detalles de la Jornada</h2>
                <p>
                  <strong>Fecha:</strong> {ajustarFechaLocal(jornadaActual.fecha).toLocaleDateString()}
                </p>
                <p>
                  <strong>Estado:</strong> {jornadaActual.estado}
                </p>
                <p>
                  <strong>Tiempo Total:</strong> {jornadaActual.tiempoTotal} minutos
                </p>
                <p>
                  <strong>Operario:</strong> {jornadaActual.operario?.name || 'N/A'}
                </p>

                <h2 className="text-xl font-semibold mt-4 mb-2">Actividades</h2>
                {jornadaActual.registros.map((actividad) => (
                  <div
                    key={actividad._id}
                    className="bg-gray-50 rounded-md p-3 mb-2 border border-gray-200"
                  >
                    <div className="flex justify-between items-center text-gray-700 text-sm">
                      <div className="flex flex-col">
                        <h4 className="font-semibold text-gray-700">
                          {actividad.proceso?.nombre || 'N/A'}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          OTI: {actividad.oti?.numeroOti || 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Área de Producción: {actividad.areaProduccion?.nombre || 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Máquina: {actividad.maquina?.nombre || 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Insumos: {actividad.insumos?.nombre || 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Tipo de Tiempo: {actividad.tipoTiempo || 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Hora Inicio: {actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString() : 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Hora Fin: {actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString() : 'N/A'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Tiempo: {actividad.tiempo} minutos
                        </p>
                        <p className="text-gray-600 text-sm">
                          Observaciones: {actividad.observaciones || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEditarActividad(actividad._id)}>
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleEliminarActividad(actividad._id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <p>No hay una jornada activa actualmente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiJornada;
