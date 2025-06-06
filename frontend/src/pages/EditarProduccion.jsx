import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Card, Input, Button } from '../components/ui/index';
import  axiosInstance  from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { verificarYCrear } from '../utils/verificarYCrear';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useNavigate, useParams } from 'react-router-dom';

function EditarProduccion({ produccion: produccionProp, onClose, onGuardar, invokedAsModal }) { 
  const { id: paramId } = useParams();
  const [registroEditado, setRegistroEditado] = useState({});
  const [produccionLocal, setProduccionLocal] = useState(produccionProp);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); 
  const [allProcesos, setAllProcesos] = useState([]); // Todos los procesos
  // Procesos filtrados por área (legacy, para compatibilidad con el select actual)
  const [filteredProcesos, setFilteredProcesos] = useState([]);
  // Procesos válidos para el área seleccionada (fetch dinámico, igual que en RegistroProduccion)
  const [availableProcesos, setAvailableProcesos] = useState([]);
  const [insumosColeccion, setInsumosColeccion] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [areasProduccion, setAreasProduccion] = useState([]);

  const navigate = useNavigate();

  // Helper function to format time values
  const formatTime = (timeValue) => {
    if (!timeValue) return "";
    // Check if it's a Date object or an ISO string with 'T'
    if (timeValue instanceof Date || (typeof timeValue === 'string' && timeValue.includes('T'))) {
      try {
        // Format to HH:MM using toLocaleTimeString
        return new Date(timeValue).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) {
        console.error("Error formatting date:", e);
        return ""; // Return empty if formatting fails
      }
    } else if (typeof timeValue === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeValue)) {
      // If it's already a string like "HH:MM" or "HH:MM:SS", return the HH:MM part
      return timeValue.slice(0, 5);
    }
    // Fallback for unparseable or unexpected formats
    return "";
  };

  // Normaliza el campo OTI para que siempre sea { numeroOti: string }
  function normalizeOti(oti) {
    if (!oti) return { numeroOti: "" };
    if (typeof oti === "object") {
      if (oti.numeroOti) {
        return { numeroOti: String(oti.numeroOti) }; // Ensure numeroOti is a string
      }
      // Si es un objeto pero no tiene numeroOti (e.g., it's just an _id), return empty numeroOti
      return { numeroOti: "" };
    }
    if (typeof oti === "string") {
      // If it looks like an ObjectId, treat it as if it has no displayable numeroOti
      if (/^[a-f\d]{24}$/i.test(oti)) {
        return { numeroOti: "" };
      }
      return { numeroOti: oti }; // It's a string, hopefully the numeroOti itself
    }
    return { numeroOti: "" }; // Default fallback
  }


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
    const fetchProduccionById = async (id) => {
      setIsLoading(true);
      setError(null); 
      try {
        const response = await axiosInstance.get(`/produccion/buscar-produccion?_id=\${id}`);
        if (response.data) {
          
          const fetchedData = Array.isArray(response.data.resultados) && response.data.resultados.length === 1 
                              ? response.data.resultados[0] 
                              : (Array.isArray(response.data) && response.data.length === 1 ? response.data[0] : response.data);
          
          if (typeof fetchedData === 'object' && fetchedData !== null && !Array.isArray(fetchedData)) {
            setProduccionLocal(fetchedData);
          } else {
            setError('Formato de datos inesperado del servidor.');
            setProduccionLocal(null);
          }
        } else {
          setProduccionLocal(null);
          setError('No se encontró el registro de producción.');
        }
      } catch (err) {
        setError('No se pudo cargar los datos de producción. Intenta de nuevo más tarde.');
        setProduccionLocal(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (produccionProp) {
      setProduccionLocal(produccionProp);
      setIsLoading(false);
      setError(null);
    } else if (paramId) {
      fetchProduccionById(paramId);
    } else if (!invokedAsModal) { 
      setProduccionLocal(null);
      setIsLoading(false);
     
    }
  }, [produccionProp, paramId, invokedAsModal]);

  useEffect(() => {
    if (produccionLocal) {
      const fechaFormateada = produccionLocal.fecha ? new Date(produccionLocal.fecha).toISOString().split('T')[0] : "";
      // formatTime is now defined at component scope
      // normalizeOti is now defined at component scope

      // --- NUEVO: Esperar a que allProcesos esté cargado antes de setear procesos ---
      // Si no hay procesos cargados aún, esperar y reintentar
      if (!allProcesos || allProcesos.length === 0) {
        // Esperar a que se cargue allProcesos antes de setRegistroEditado
        return;
      }

      // Normalizar procesos: obtener siempre array de IDs (string)
      let procesosIds = [];
      if (Array.isArray(produccionLocal.procesos)) {
        procesosIds = produccionLocal.procesos.map(p => (typeof p === 'object' && p !== null ? p._id : p)).filter(Boolean);
      } else if (Array.isArray(produccionLocal.proceso)) {
        procesosIds = produccionLocal.proceso.map(p => (typeof p === 'object' && p !== null ? p._id : p)).filter(Boolean);
      } else if (produccionLocal.procesos?._id) {
        procesosIds = [produccionLocal.procesos._id];
      } else if (produccionLocal.proceso?._id) {
        procesosIds = [produccionLocal.proceso._id];
      } else if (produccionLocal.procesos) {
        procesosIds = [produccionLocal.procesos];
      } else if (produccionLocal.proceso) {
        procesosIds = [produccionLocal.proceso];
      }

      // Validar que los procesos existan en allProcesos (por si hay datos antiguos)
      procesosIds = procesosIds.filter(pid => allProcesos.some(p => String(p._id) === String(pid)));

      // Normalizar insumos: obtener siempre array de IDs (string)
      let insumosIds = [];
      if (Array.isArray(produccionLocal.insumos)) {
        insumosIds = produccionLocal.insumos.map(i => (typeof i === 'object' && i !== null ? i._id : i)).filter(Boolean);
      } else if (produccionLocal.insumos?._id) {
        insumosIds = [produccionLocal.insumos._id];
      } else if (produccionLocal.insumos) {
        insumosIds = [produccionLocal.insumos];
      }

      // Normalizar área de producción: siempre string (ID)
      let areaProduccionId = "";
      if (produccionLocal.areaProduccion) {
        if (typeof produccionLocal.areaProduccion === 'object' && produccionLocal.areaProduccion._id) {
          areaProduccionId = String(produccionLocal.areaProduccion._id);
        } else {
          areaProduccionId = String(produccionLocal.areaProduccion);
        }
      }

      // Debug temporal para ver los datos
      console.log('allProcesos:', allProcesos);
      console.log('procesosIds:', procesosIds);
      console.log('areaProduccionId:', areaProduccionId);

      setRegistroEditado({
        ...produccionLocal, // Spread first to get all existing fields
        fecha: fechaFormateada,
        oti: normalizeOti(produccionLocal.oti), // Use component-scoped normalizeOti
        procesos: procesosIds,
        insumos: insumosIds,
        maquina: produccionLocal.maquina?._id || produccionLocal.maquina || "",
        areaProduccion: areaProduccionId,
        observaciones: produccionLocal.observaciones || "",
        tipoTiempo: produccionLocal.tipoTiempo || "",
        horaInicio: formatTime(produccionLocal.horaInicio), // Use component-scoped formatTime
        horaFin: formatTime(produccionLocal.horaFin),       // Use component-scoped formatTime
        tiempo: produccionLocal.tiempo || 0
        // Ensure operario is handled if it's part of produccionLocal and needs to be in registroEditado
        // operario: produccionLocal.operario?._id || produccionLocal.operario || "", // Example if needed
      });

  // REMOVE REDUNDANT normalizeOti definition from here if it existed
  // REMOVE REDUNDANT formatTime definition from here

    } else {
      setRegistroEditado({
        oti: { numeroOti: "" }, procesos: [], insumos: [], maquina: "", areaProduccion: "",
        fecha: "", tipoTiempo: "", horaInicio: "", horaFin: "", tiempo: 0, observaciones: ""
      });
    }
  }, [produccionLocal, allProcesos]);

  useEffect(() => {
    const cargarDatosColecciones = async () => {
      try {
        const procesosResponse = await axiosInstance.get('produccion/procesos');
        setAllProcesos(procesosResponse.data);

        const insumosResponse = await axiosInstance.get('produccion/insumos');
        setInsumosColeccion(insumosResponse.data);

        const maquinasResponse = await axiosInstance.get('produccion/maquinas');
        setMaquinas(maquinasResponse.data);

        const areasResponse = await axiosInstance.get('produccion/areas');
        setAreasProduccion(areasResponse.data);

      } catch (error) {
        toast.error("No se pudieron cargar los datos para la edición. Intenta de nuevo más tarde.");
      }
    };

    cargarDatosColecciones();
  }, []);

  // Filtrado dinámico de procesos por área (fetch igual que en RegistroProduccion)
  useEffect(() => {
    const fetchProcesosForArea = async (areaId) => {
      if (!areaId) {
        setAvailableProcesos([]);
        setFilteredProcesos([]);
        setRegistroEditado(prev => ({ ...prev, procesos: [] }));
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/procesos?areaId=${areaId}`);
        if (response.ok) {
          const data = await response.json();
          let determinedProcesos = [];
          if (Array.isArray(data)) {
            determinedProcesos = data;
          } else if (data && Array.isArray(data.procesos)) {
            determinedProcesos = data.procesos;
          } else if (data && data.procesos && !Array.isArray(data.procesos)) {
            determinedProcesos = [];
          } else {
            determinedProcesos = [];
          }
          setAvailableProcesos(determinedProcesos);
          setFilteredProcesos(determinedProcesos); // Para compatibilidad con el select actual
          // Limpiar procesos no válidos
          setRegistroEditado(prev => {
            const nuevosProcesos = (prev.procesos || []).filter(pid => determinedProcesos.some(p => String(p._id) === String(pid)));
            return { ...prev, procesos: nuevosProcesos };
          });
        } else {
          setAvailableProcesos([]);
          setFilteredProcesos([]);
          setRegistroEditado(prev => ({ ...prev, procesos: [] }));
        }
      } catch (error) {
        setAvailableProcesos([]);
        setFilteredProcesos([]);
        setRegistroEditado(prev => ({ ...prev, procesos: [] }));
      }
    };
    fetchProcesosForArea(registroEditado.areaProduccion);
  }, [registroEditado.areaProduccion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegistroEditado(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Handler para selects de react-select y nativos
  const handleChangeRelacion = (selectedOptions, actionMeta) => {
    if (actionMeta && actionMeta.name) {
      const name = actionMeta.name;
      if (name === 'procesos') {
        setRegistroEditado(prev => ({
          ...prev,
          procesos: selectedOptions ? selectedOptions.map(opt => opt.value) : []
        }));
      } else if (name === 'insumos') {
        setRegistroEditado(prev => ({
          ...prev,
          insumos: selectedOptions ? selectedOptions.map(opt => opt.value) : []
        }));
      }
    } else if (selectedOptions && selectedOptions.target) {
      // Evento de select nativo (maquina, tipoTiempo, areaProduccion)
      const { name, value } = selectedOptions.target;
      if (name === 'areaProduccion') {
        // Al cambiar el área, limpiar procesos y fetch dinámico (el useEffect se encarga del fetch)
        setRegistroEditado(prev => ({
          ...prev,
          [name]: value,
          procesos: []
        }));
      } else {
        setRegistroEditado(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const guardarEdicion = async () => {
    try {
      if (
        !registroEditado.fecha ||
        !registroEditado.procesos ||
        !Array.isArray(registroEditado.procesos) ||
        registroEditado.procesos.length === 0 ||
        !registroEditado.insumos ||
        !registroEditado.maquina ||
        !registroEditado.areaProduccion ||
        !registroEditado.tipoTiempo ||
        !registroEditado.horaInicio ||
        !registroEditado.horaFin
      ) {
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

              const currentProduccionId = produccionLocal?._id || paramId;
              if (!currentProduccionId) {
                toast.error("⚠️ No se pudo determinar el ID de la producción a actualizar.");
                return;
              }

              const normalizarTexto = (texto) => (typeof texto === 'string' ? texto.trim().toLowerCase() : texto);

              // --- OTI PATCH: Mantener el número OTI en el estado tras guardar ---
              const numeroOtiOriginalFormulario = registroEditado.oti?.numeroOti || "";
              const otiId = await verificarYCrear(normalizarTexto(numeroOtiOriginalFormulario), "oti");
              // Asegurar que procesos e insumos sean siempre arrays de strings
              const procesosIds = Array.isArray(registroEditado.procesos)
                ? registroEditado.procesos.filter(Boolean).map(String)
                : registroEditado.procesos ? [String(registroEditado.procesos)] : [];
              const insumosIds = Array.isArray(registroEditado.insumos)
                ? registroEditado.insumos.filter(Boolean).map(String)
                : registroEditado.insumos ? [String(registroEditado.insumos)] : [];
              const areaId = registroEditado.areaProduccion;
              const maquinaId = registroEditado.maquina;

              if (!otiId || !procesosIds || procesosIds.length === 0 || !areaId || !maquinaId || !insumosIds || insumosIds.length === 0) {
                toast.error("❌ No se pudieron verificar o crear todas las entidades requeridas.");
                return;
              }

              let tiempo = 0;
              let horaInicioISO = null;
              let horaFinISO = null;
              if (registroEditado.horaInicio && registroEditado.horaFin && registroEditado.fecha) {
                // Combinar fecha y hora para formato ISO
                const [year, month, day] = registroEditado.fecha.split('-');
                horaInicioISO = new Date(Number(year), Number(month) - 1, Number(day), ...registroEditado.horaInicio.split(':')).toISOString();
                horaFinISO = new Date(Number(year), Number(month) - 1, Number(day), ...registroEditado.horaFin.split(':')).toISOString();
                const inicio = new Date(horaInicioISO);
                const fin = new Date(horaFinISO);
                if (fin > inicio) {
                  tiempo = Math.floor((fin - inicio) / 60000);
                }
              }

              const datosActualizados = {
                _id: currentProduccionId,
                oti: otiId,
                operario: produccionLocal?.operario?._id || produccionLocal?.operario || registroEditado.operario,
                procesos: procesosIds,
                insumos: insumosIds,
                areaProduccion: areaId,
                maquina: maquinaId,
                fecha: registroEditado.fecha || null,
                tipoTiempo: registroEditado.tipoTiempo,
                horaInicio: horaInicioISO,
                horaFin: horaFinISO,
                tiempo,
                observaciones: registroEditado.observaciones
              };

              // --- BEGIN ADDED LOGS ---
              console.log("Frontend: currentProduccionId", currentProduccionId);
              console.log("Frontend: datosActualizados", datosActualizados);
              // --- END ADDED LOGS ---

              const response = await axiosInstance.put(`/produccion/actualizar/${currentProduccionId}`, datosActualizados);

              if (response.status >= 200 && response.status < 300) {
                toast.success("✅ Producción actualizada con éxito");

                if (response.data && response.data.produccion) {
                  const produccionActualizadaBackend = response.data.produccion;

                  // Preparar datos para setProduccionLocal, preservando el OTI number string
                  const nuevaProduccionLocal = {
                    ...produccionActualizadaBackend,
                    oti: { numeroOti: numeroOtiOriginalFormulario }, // Use the string OTI number from form
                    // Backend might return ISO strings for dates/times, keep them as is for produccionLocal
                    // or re-normalize if needed. For display, formatTime will be used by setRegistroEditado.
                  };
                  setProduccionLocal(nuevaProduccionLocal);

                  // También actualizar el formulario de edición para reflejar los datos guardados
                  // y mantener la consistencia, especialmente el OTI.
                  setRegistroEditado({
                    ...nuevaProduccionLocal, // Start with the updated local data (which includes correct OTI string)
                    // Ensure all fields for the form are correctly set and formatted for display
                    fecha: nuevaProduccionLocal.fecha ? new Date(nuevaProduccionLocal.fecha).toISOString().split('T')[0] : "",
                    // oti is already correct from nuevaProduccionLocal
                    procesos: (nuevaProduccionLocal.procesos || []).map(p => (typeof p === 'object' && p !== null ? p._id : p)).filter(Boolean),
                    insumos: (nuevaProduccionLocal.insumos || []).map(i => (typeof i === 'object' && i !== null ? i._id : i)).filter(Boolean),
                    maquina: nuevaProduccionLocal.maquina?._id || nuevaProduccionLocal.maquina || "",
                    areaProduccion: nuevaProduccionLocal.areaProduccion?._id || nuevaProduccionLocal.areaProduccion || "",
                    horaInicio: formatTime(nuevaProduccionLocal.horaInicio), // Format for display
                    horaFin: formatTime(nuevaProduccionLocal.horaFin),       // Format for display
                    // operario: nuevaProduccionLocal.operario?._id || nuevaProduccionLocal.operario, // if needed
                  });

                  if (onGuardar) onGuardar(nuevaProduccionLocal); // Pass the updated data with correct OTI structure
                  if (onClose) onClose();
                  if (!onGuardar && !onClose && paramId) {
                    // If it's a page and not a modal, potentially navigate or refresh
                    // navigate(`/ruta-detalle/\${currentProduccionId}`); // Example
                  }
                } else {
                  // Handle case where response.data.produccion is not available but status was success
                  toast.warn("Producción actualizada, pero no se recibieron datos detallados del servidor. Refrescando con OTI local.");
                  // Attempt to keep the form OTI consistent
                  setRegistroEditado(prev => ({ ...prev, oti: { numeroOti: numeroOtiOriginalFormulario } }));
                  if (onClose) onClose();
                }

              } else {
                // Handle non-2xx responses that don't throw an error by default with axios
                const errorMsg = response.data?.message || response.statusText || "Error desconocido del servidor";
                toast.error(`❌ Error al actualizar: ${errorMsg}`);
                // Optionally, revert OTI or keep form as is for user to retry
                setRegistroEditado(prev => ({ ...prev, oti: { numeroOti: numeroOtiOriginalFormulario } }));
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
      console.error("Error en guardarEdicion:", error.response?.data || error.message || error);
      toast.error(`❌ No se pudo guardar la edición: ${error.response?.data?.message || error.message || 'Intenta de nuevo más tarde.'}`);
      // Ensure OTI in form remains what the user typed, in case of error
      setRegistroEditado(prev => ({ ...prev, oti: { numeroOti: prev.oti?.numeroOti || '' } }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    guardarEdicion();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white">
          <h2 className="text-2xl font-bold text-center text-blue-700">Cargando Datos...</h2>
        </Card>
      );
    }

    if (error) { 
      return (
        <Card className="w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white">
          <h2 className="text-2xl font-bold text-center text-red-700">{error}</h2>
          <div className="flex justify-center mt-4">
            <Button onClick={() => { if (onClose) onClose(); else navigate(-1); }} className="border-gray-300 px-6 py-2 rounded-lg">
              {onClose ? 'Cerrar' : 'Volver'}
            </Button>
          </div>
        </Card>
      );
    }
    
    
    if (!produccionLocal && ((!paramId && !produccionProp && invokedAsModal) || (!paramId && !invokedAsModal))) {
        return (
            <Card className="w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white">
                <h2 className="text-2xl font-bold text-center text-red-700">No hay datos de producción para editar.</h2>
                <div className="flex justify-center mt-4">
                    <Button onClick={() => { if (onClose) onClose(); else navigate(-1); }} className="border-gray-300 px-6 py-2 rounded-lg">
                        {onClose ? 'Cerrar' : 'Volver'}
                    </Button>
                </div>
            </Card>
        );
    }

   
    if (!produccionLocal) {
        
        return (
            <Card className="w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white">
                <h2 className="text-2xl font-bold text-center text-red-700">Datos de producción no disponibles.</h2>
                 <div className="flex justify-center mt-4">
                    <Button onClick={() => { if (onClose) onClose(); else navigate(-1); }} className="border-gray-300 px-6 py-2 rounded-lg">
                        {onClose ? 'Cerrar' : 'Volver'}
                    </Button>
                </div>
            </Card>
        );
    }

   
    return (
      <Card className="w-full max-w-md p-6 rounded-3xl shadow-2xl bg-white transform transition-all duration-300 scale-100 opacity-100 translate-y-0 animate-fade-in-up border border-blue-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700 tracking-tight">Editar Producción</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="OTI"
            value={registroEditado.oti?.numeroOti || ''}
            onChange={(e) => setRegistroEditado(prev => ({ ...prev, oti: { ...prev.oti, numeroOti: e.target.value } }))}
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
            <label htmlFor="procesos" className="block text-sm font-semibold text-gray-700">Proceso(s)</label>
            <Select
              inputId="procesos"
              isMulti
              name="procesos"
              options={availableProcesos.map(p => ({ value: p._id, label: p.nombre }))}
              value={registroEditado.procesos
                ? registroEditado.procesos.map(pId => {
                    const procesoInfo = availableProcesos.find(ap => String(ap._id) === String(pId));
                    return procesoInfo ? { value: procesoInfo._id, label: procesoInfo.nombre } : null;
                  }).filter(p => p !== null)
                : []}
              onChange={(selectedOptions, actionMeta) => handleChangeRelacion(selectedOptions, { name: 'procesos', action: actionMeta.action })}
              className="w-full basic-multi-select"
              classNamePrefix="select"
              placeholder="Seleccionar Proceso(s)"
              isDisabled={!registroEditado.areaProduccion || (availableProcesos && availableProcesos.length === 0)}
              styles={{ control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', '&:hover': { borderColor: 'hsl(var(--input))' } }), placeholder: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' }) }}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="insumos" className="block text-sm font-semibold text-gray-700">Insumo(s)</label>
            <Select
              inputId="insumos"
              isMulti
              name="insumos"
              options={insumosColeccion
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map(i => ({ value: i._id, label: i.nombre }))}
              value={registroEditado.insumos
                ? registroEditado.insumos.map(insumoId => {
                    const insumoInfo = insumosColeccion.find(i => i._id === insumoId);
                    return insumoInfo ? { value: insumoInfo._id, label: insumoInfo.nombre } : null;
                  }).filter(i => i !== null)
                : []}
              onChange={(selectedOptions, actionMeta) => handleChangeRelacion(selectedOptions, { name: 'insumos', action: actionMeta.action })}
              className="w-full basic-multi-select"
              classNamePrefix="select"
              placeholder="Seleccionar Insumo(s)"
              styles={{ control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', '&:hover': { borderColor: 'hsl(var(--input))' } }), placeholder: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' }) }}
              required
            />
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
            value={((inicioStr, finStr) => {
              if (inicioStr && finStr) {
                const inicio = new Date(`1970-01-01T${inicioStr}:00`);
                const fin = new Date(`1970-01-01T${finStr}:00`);
                if (fin > inicio) {
                  return Math.floor((fin - inicio) / 60000);
                }
              }
              return 0;
            })(registroEditado.horaInicio, registroEditado.horaFin)}
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
          <div className="flex justify-end gap-4 pt-5">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all"
            >
              Guardar Cambios
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                if (onClose) onClose();
                else if (paramId) navigate(-1); 
                else navigate('/operario-dashboard'); 
              }} 
              className="border-gray-300 px-6 py-2 rounded-lg"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    );
  };


  if (invokedAsModal) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto pt-10 pb-10 px-4">
       
        <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-300" />
        {renderContent()}
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 flex flex-col justify-center items-center p-4">
      {renderContent()} 
    </div>
  );
}

export default EditarProduccion;