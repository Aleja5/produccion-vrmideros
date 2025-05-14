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
        observaciones: produccion.observaciones || "" // Corregido para asignar directamente el valor
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
        if (!registroEditado.fecha || !registroEditado.proceso || !registroEditado.insumos || !registroEditado.maquina || !registroEditado.areaProduccion) {
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

                        const datosActualizados = {
                            _id: produccion._id, // Usar el _id de la producción que se está editando
                            oti: otiId,
                            operario: produccion.operario?._id || produccion.operario,
                            proceso: procesoId,
                            insumos: insumoId,
                            areaProduccion: areaId,
                            maquina: maquinaId,
                            fecha: registroEditado.fecha || null,
                            tiempoPreparacion: parseInt(registroEditado.tiempoPreparacion, 10),
                            tiempoOperacion: parseInt(registroEditado.tiempoOperacion, 10),
                            observaciones: registroEditado.observaciones // Agregar observaciones
                        };

                        const response = await axiosInstance.put(`/produccion/actualizar/${produccion._id}`, datosActualizados);

                        if (response.status >= 200 && response.status < 300) {
                            toast.success("✅ Producción actualizada con éxito");
                            onGuardar(); // Llama a la función para recargar los datos en el dashboard
                            onClose(); // Cierra el modal
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <Card className="w-full max-w-lg p-6 rounded-2xl shadow-2xl bg-white">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Editar Producción</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="OTI"
            value={registroEditado.oti?.numeroOti || ''}
            onChange={(e) => setRegistroEditado(prev => ({
              ...prev,
              oti: { ...prev.oti, numeroOti: e.target.value }
            }))}
          />
          <Input
            label="Fecha"
            type="date"
            value={registroEditado.fecha?.split('T')[0] || ''}
            onChange={handleChange}
            name="fecha"
          />
          <div className="space-y-2">
            <label htmlFor="proceso" className="block text-sm font-medium text-gray-700">Proceso</label>
            <select
              id="proceso"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            <label htmlFor="insumos" className="block text-sm font-medium text-gray-700">Insumo</label>
            <select
              id="insumos"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            <label htmlFor="maquina" className="block text-sm font-medium text-gray-700">Máquina</label>
            <select
              id="maquina"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            <label htmlFor="areaProduccion" className="block text-sm font-medium text-gray-700">Área de Producción</label>
            <select
              id="areaProduccion"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
          <Input
            label="Tiempo de Preparación (min)"
            type="number"
            value={registroEditado.tiempoPreparacion || ''}
            onChange={handleChange}
            name="tiempoPreparacion"
          />
          <Input
            label="Tiempo de Operación (min)"
            type="number"
            value={registroEditado.tiempoOperacion || ''}
            onChange={handleChange}
            name="tiempoOperacion"
          />
          <Input
            label="Observaciones"
            value={registroEditado.observaciones || ''}
            onChange={handleChange}
            name="observaciones"
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Guardar Cambios
            </Button>
            <Button variant="secondary" onClick={onClose} className="border-gray-300">
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EditarProduccion;