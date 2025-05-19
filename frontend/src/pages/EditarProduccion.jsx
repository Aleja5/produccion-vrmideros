import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/ui/index'; // Asegúrate de tener instalada esta librería o usa tus propios componentes
import  axiosInstance  from '../utils/axiosInstance'; // Ajusta la ruta a tu instancia de Axios
import { toast } from 'react-toastify';
import { verificarYCrear } from '../utils/verificarYCrear';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useNavigate } from 'react-router-dom';

function EditarProduccion({ produccion, onClose, onGuardar }) {
  const [registroEditado, setRegistroEditado] = useState({});
  const [procesos, setProcesos] = useState([]);
  const [insumosColeccion, setInsumosColeccion] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [areasProduccion, setAreasProduccion] = useState([]);
  const [observaciones, setObservaciones] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toast.warning("Tiempo de inactividad alcanzado. Redirigiendo a validación de cédula.");
        navigate("/validate-cedula");
      }, 180000); // 3 minutos de inactividad
    };

    const handleActivity = () => resetTimeout();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [navigate]);

  useEffect(() => {
    if (produccion) {
      const fechaFormateada = produccion.fecha ? new Date(produccion.fecha).toISOString().split('T')[0] : "";
      setRegistroEditado({
        ...produccion,
        fecha: fechaFormateada,
        oti: { numeroOti: produccion.oti?.numeroOti || "" },
        proceso: produccion.proceso?._id || "",
        insumos: produccion.insumos?._id || "",
        maquina: produccion.maquina?._id || "",
        areaProduccion: produccion.areaProduccion?._id || "",
        observaciones: produccion.observaciones || "",
        tipoTiempo: produccion.tipoTiempo || "",
        horaInicio: produccion.horaInicio ? produccion.horaInicio.slice(11,16) : "",
        horaFin: produccion.horaFin ? produccion.horaFin.slice(11,16) : "",
        tiempo: produccion.tiempo || 0
      });
    } else {
      // Estado inicial para agregar actividad
      setRegistroEditado({
        oti: { numeroOti: "" },
        proceso: "",
        insumos: "",
        maquina: "",
        areaProduccion: "",
        fecha: "",
        tipoTiempo: "",
        horaInicio: "",
        horaFin: "",
        tiempo: 0,
        observaciones: ""
      });
    }
  }, [produccion]);

  useEffect(() => {
    const cargarDatosColecciones = async () => {
      try {
        const procesosResponse = await axiosInstance.get('produccion/procesos');
        setProcesos(procesosResponse.data);

        const insumosResponse = await axiosInstance.get('produccion/insumos');
        setInsumosColeccion(insumosResponse.data);

        const maquinasResponse = await axiosInstance.get('produccion/maquinas');
        setMaquinas(maquinasResponse.data);

        const areasResponse = await axiosInstance.get('produccion/areas');
        setAreasProduccion(areasResponse.data);

      } catch (error) {
        console.error("Error al cargar los datos de las colecciones:", error);
        toast.error("Error al cargar los datos para la edición.");
      }
    };

    cargarDatosColecciones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegistroEditado(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangeRelacion = (e) => {
    const { name, value } = e.target;
    setRegistroEditado(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarEdicion = async () => {
    try {
        // Validar que todos los campos obligatorios estén completos
        if (!registroEditado.fecha || !registroEditado.proceso || !registroEditado.insumos || !registroEditado.maquina || !registroEditado.areaProduccion || !registroEditado.tipoTiempo || !registroEditado.horaInicio || !registroEditado.horaFin) {
            toast.error("⚠️ Por favor, completa todos los campos obligatorios antes de guardar.");
            return;
        }

        confirmAlert({
            title: 'Confirmar Guardado',
            message: '¿Estás seguro de que deseas guardar los cambios?',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        if (!registroEditado || Object.keys(registroEditado).length === 0) {
                            toast.error("⚠️ No hay datos para guardar.");
                            return;
                        }

                        const normalizarTexto = (texto) => (typeof texto === 'string' ? texto.trim().toLowerCase() : texto);

                        const otiId = await verificarYCrear(normalizarTexto(registroEditado.oti?.numeroOti || ''), "oti");
                        const procesoId = registroEditado.proceso;
                        const insumoId = registroEditado.insumos;
                        const areaId = registroEditado.areaProduccion;
                        const maquinaId = registroEditado.maquina;

                        if (!otiId || !procesoId || !areaId || !maquinaId || !insumoId) {
                            toast.error("❌ No se pudieron verificar o crear todas las entidades requeridas.");
                            return;
                        }

                        // Calcular el tiempo en minutos
                        let tiempo = 0;
                        if (registroEditado.horaInicio && registroEditado.horaFin) {
                          const inicio = new Date(`1970-01-01T${registroEditado.horaInicio}:00`);
                          const fin = new Date(`1970-01-01T${registroEditado.horaFin}:00`);
                          if (fin > inicio) {
                            tiempo = Math.floor((fin - inicio) / 60000);
                          }
                        }

                        const datosActualizados = {
                            _id: produccion._id,
                            oti: otiId,
                            operario: produccion.operario?._id || produccion.operario,
                            proceso: procesoId,
                            insumos: insumoId,
                            areaProduccion: areaId,
                            maquina: maquinaId,
                            fecha: registroEditado.fecha || null,
                            tipoTiempo: registroEditado.tipoTiempo,
                            horaInicio: registroEditado.horaInicio,
                            horaFin: registroEditado.horaFin,
                            tiempo,
                            observaciones: registroEditado.observaciones
                        };

                        const response = await axiosInstance.put(`/produccion/actualizar/${produccion._id}`, datosActualizados);

                        if (response.status >= 200 && response.status < 300) {
                            toast.success("✅ Producción actualizada con éxito");
                            onGuardar();
                            onClose();
                        } else {
                            throw new Error("⚠️ La respuesta del servidor no indica éxito.");
                        }
                    }
                },
                {
                    label: 'Cancelar',
                    onClick: () => {}
                }
            ]
        });
    } catch (error) {
        console.error('❌ Error al editar la producción:', error);
        if (error.response) {
            toast.error(`Error: ${error.response.data.message || "No se pudo guardar la edición."}`);
        } else {
            toast.error(`⚠️ Error: ${error.message}`);
        }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    guardarEdicion();
  };

  if (!produccion) {
    return null; // O algún otro indicador de que no hay producción para editar
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* Overlay con animación */}
      <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-300" />

      {/* Modal Card con animación y mejor diseño */}
      <Card className="w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white transform transition-all duration-300 scale-100 opacity-100 translate-y-0 animate-fade-in-up border border-blue-100">
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700 tracking-tight">Editar Producción</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="OTI"
            value={registroEditado.oti?.numeroOti || ''}
            onChange={(e) => setRegistroEditado(prev => ({
              ...prev,
              oti: { ...prev.oti, numeroOti: e.target.value }
            }))}
            className="focus:ring-2 focus:ring-blue-400"
          />
          <Input
            label="Fecha"
            type="date"
            value={registroEditado.fecha?.split('T')[0] || ''}
            onChange={handleChange}
            name="fecha"
            className="focus:ring-2 focus:ring-blue-400"
          />
          <div className="space-y-2">
            <label htmlFor="proceso" className="block text-sm font-semibold text-gray-700">Proceso</label>
            <select
              id="proceso"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 sm:text-sm"
              value={registroEditado.proceso || ''}
              onChange={handleChangeRelacion}
              name="proceso"
            >
              <option value="">Seleccionar Proceso</option>
              {procesos.map((proceso) => (
                <option key={proceso._id} value={proceso._id}>{proceso.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="insumos" className="block text-sm font-semibold text-gray-700">Insumo</label>
            <select
              id="insumos"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 sm:text-sm"
              value={registroEditado.insumos || ''}
              onChange={handleChangeRelacion}
              name="insumos"
            >
              <option value="">Seleccionar Insumo</option>
              {insumosColeccion.map((insumo) => (
                <option key={insumo._id} value={insumo._id}>{insumo.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="maquina" className="block text-sm font-semibold text-gray-700">Máquina</label>
            <select
              id="maquina"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 sm:text-sm"
              value={registroEditado.maquina || ''}
              onChange={handleChangeRelacion}
              name="maquina"
            >
              <option value="">Seleccionar Máquina</option>
              {maquinas.map((maquina) => (
                <option key={maquina._id} value={maquina._id}>{maquina.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="areaProduccion" className="block text-sm font-semibold text-gray-700">Área de Producción</label>
            <select
              id="areaProduccion"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 sm:text-sm"
              value={registroEditado.areaProduccion || ''}
              onChange={handleChangeRelacion}
              name="areaProduccion"
            >
              <option value="">Seleccionar Área de Producción</option>
              {areasProduccion.map((area) => (
                <option key={area._id} value={area._id}>{area.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
          <label htmlFor="tipoTiempo" className="block text-sm font-semibold text-gray-700">Tipo de Tiempo</label>
          <select
            id="tipoTiempo"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 sm:text-sm"
            value={registroEditado.tipoTiempo || ''}
            onChange={handleChangeRelacion}
            name="tipoTiempo"
            required
          >
            <option value="">Seleccionar Tipo de Tiempo</option>
            <option value="Preparación">Preparación</option>
            <option value="Operación">Operación</option>
            <option value="Alimentacion">Alimentación</option>
          </select>
        </div>
          <div className="flex gap-4">
            <Input
              label="Hora Inicio"
              type="time"
              value={registroEditado.horaInicio || ''}
              onChange={handleChange}
              name="horaInicio"
              className="focus:ring-2 focus:ring-blue-400"
              required
            />
            <Input
              label="Hora Fin"
              type="time"
              value={registroEditado.horaFin || ''}
              onChange={handleChange}
              name="horaFin"
              className="focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <Input
            label="Tiempo (minutos)"
            type="number"
            value={(() => {
              if (registroEditado.horaInicio && registroEditado.horaFin) {
                const inicio = new Date(`1970-01-01T${registroEditado.horaInicio}:00`);
                const fin = new Date(`1970-01-01T${registroEditado.horaFin}:00`);
                if (fin > inicio) {
                  return Math.floor((fin - inicio) / 60000);
                }
              }
              return 0;
            })()}
            readOnly
            disabled
            className="focus:ring-2 focus:ring-blue-400 bg-gray-100 cursor-not-allowed"
          />
          <Input
            label="Observaciones"
            value={registroEditado.observaciones || ''}
            onChange={handleChange}
            name="observaciones"
            className="focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all"
            >
              Guardar Cambios
            </Button>
            <Button variant="secondary" onClick={onClose} className="border-gray-300 px-6 py-2 rounded-lg">
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EditarProduccion;