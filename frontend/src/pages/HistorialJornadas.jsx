import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Card, Button } from "../components/ui/index";
import { Sidebar } from "../components/Sidebar";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

const ajustarFechaLocal = (fechaUTC) => {
  const fecha = new Date(fechaUTC);
  return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

const HistorialJornadas = () => {
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJornada, setExpandedJornada] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJornadas = async () => {
      try {
        setLoading(true);

        // Retrieve operario details from localStorage
        const storedOperario = JSON.parse(localStorage.getItem("operario"));
        if (!storedOperario || !storedOperario._id) {
          toast.error("No se encontró información del operario. Por favor, inicie sesión nuevamente.");
          navigate("/validate-cedula");
          return;
        }

        const operarioId = storedOperario._id;
        const response = await axiosInstance.get(`/jornadas/operario/${operarioId}`);
        setJornadas(response.data);
      } catch (error) {
        console.error("Error al obtener las jornadas:", error);
        toast.error("No se pudieron cargar las jornadas.");
      } finally {
        setLoading(false);
      }
    };

    fetchJornadas();
  }, [navigate]);

  const toggleExpand = (jornadaId) => {
    setExpandedJornada((prev) => (prev === jornadaId ? null : jornadaId));
  };

  const handleEditarActividad = (produccionId) => {
    navigate(`/produccion/actualizar/${produccionId}`);
  };

  const handleEliminarActividad = async (produccionId) => {
    try {
      await axiosInstance.delete(`/produccion/eliminar/${produccionId}`);
      toast.success("Actividad eliminada con éxito");
      setJornadas((prev) =>
        prev.map((jornada) =>
          jornada._id === expandedJornada
            ? {
                ...jornada,
                registros: jornada.registros.filter((registro) => registro._id !== produccionId),
              }
            : jornada
        )
      );
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);
      toast.error("No se pudo eliminar la actividad.");
    }
  };

  if (loading) return <p>Cargando historial de jornadas...</p>;

  return (
    <div className="flex bg-gray-100 h-screen">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Historial de Jornadas</h1>

          {jornadas.length > 0 ? (
            <div className="space-y-4">
              {jornadas.filter((jornada) => jornada.registros?.length > 0).map((jornada) => (
                <Card key={jornada._id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Fecha: {ajustarFechaLocal(jornada.fecha).toLocaleDateString()}</p>
                      <p>Tiempo Total: {jornada.tiempoTotal} minutos</p>
                      <p>Actividades: {jornada.registros?.length || 0}</p>
                    </div>
                    <Button onClick={() => toggleExpand(jornada._id)}>
                      {expandedJornada === jornada._id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                    </Button>
                  </div>

                  {expandedJornada === jornada._id && (
                    <div className="mt-4 space-y-2">
                      {jornada.registros.map((actividad) => (
                        <div key={actividad._id} className="border p-3 rounded-md">
                          <p className="font-semibold">Proceso: {actividad.proceso?.nombre || "N/A"}</p>
                          <p>OTI: {actividad.oti?.numeroOti || "N/A"}</p>
                          <p>Área: {actividad.areaProduccion?.nombre || "N/A"}</p>
                          <p>Máquina: {actividad.maquina?.nombre || "N/A"}</p>
                          <p>Insumos: {actividad.insumos?.nombre || "N/A"}</p>
                          <p>Tipo de Tiempo: {actividad.tipoTiempo || "N/A"}</p>
                          <p>Hora Inicio: {actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString() : "N/A"}</p>
                          <p>Hora Fin: {actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString() : "N/A"}</p>
                          <p>Tiempo: {actividad.tiempo} minutos</p>
                          <p>Observaciones: {actividad.observaciones || "N/A"}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button onClick={() => handleEditarActividad(actividad._id)}>Editar</Button>
                            <Button variant="destructive" onClick={() => handleEliminarActividad(actividad._id)}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p>No se encontraron jornadas anteriores.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialJornadas;
