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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const navigate = useNavigate();

  // Hook para manejar el tamaño de ventana
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to get responsive select styles
  const getSelectStyles = () => ({
    control: (base, state) => ({ 
      ...base, 
      borderColor: state.isFocused ? '#3B82F6' : 'hsl(var(--input))', 
      '&:hover': { borderColor: '#3B82F6' },
      minHeight: windowWidth < 640 ? '36px' : '40px',
      fontSize: windowWidth < 640 ? '14px' : '16px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : base.boxShadow
    }), 
    placeholder: (base) => ({ 
      ...base, 
      color: 'hsl(var(--muted-foreground))',
      fontSize: windowWidth < 640 ? '14px' : '16px'
    }),
    multiValue: (base) => ({
      ...base,
      fontSize: windowWidth < 640 ? '12px' : '14px',
      backgroundColor: '#EBF8FF'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1E40AF'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: windowWidth < 640 ? '14px' : '16px',
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EBF8FF' : base.backgroundColor
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999
    })
  });

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
  // Función de validación mejorada
  const validateForm = () => {
    const errors = [];
    
    if (!registroEditado.fecha) errors.push("La fecha es requerida");
    if (!registroEditado.procesos || registroEditado.procesos.length === 0) errors.push("Debe seleccionar al menos un proceso");
    if (!registroEditado.insumos || registroEditado.insumos.length === 0) errors.push("Debe seleccionar al menos un insumo");
    if (!registroEditado.maquina) errors.push("La máquina es requerida");
    if (!registroEditado.areaProduccion) errors.push("El área de producción es requerida");
    if (!registroEditado.tipoTiempo) errors.push("El tipo de tiempo es requerido");
    if (!registroEditado.horaInicio) errors.push("La hora de inicio es requerida");
    if (!registroEditado.horaFin) errors.push("La hora de fin es requerida");
    
    if (registroEditado.horaInicio && registroEditado.horaFin) {
      const inicio = new Date(`1970-01-01T${registroEditado.horaInicio}:00`);
      const fin = new Date(`1970-01-01T${registroEditado.horaFin}:00`);
      if (fin <= inicio) {
        errors.push("La hora de fin debe ser posterior a la hora de inicio");
      }
    }
    
    return errors;
  };

  const guardarEdicion = async () => {
    try {
      // Validación mejorada
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast.error(`⚠️ ${validationErrors[0]}`);
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

              const normalizarTexto = (texto) => (typeof texto === 'string' ? texto.trim().toLowerCase() : texto);              // --- OTI PATCH: Mantener el número OTI en el estado tras guardar ---
              const numeroOtiOriginalFormulario = registroEditado.oti?.numeroOti || "";
              // No need to call verificarYCrear here - send the OTI number to backend directly
              // const otiId = await verificarYCrear(normalizarTexto(numeroOtiOriginalFormulario), "oti");
              // Asegurar que procesos e insumos sean siempre arrays de strings
              const procesosIds = Array.isArray(registroEditado.procesos)
                ? registroEditado.procesos.filter(Boolean).map(String)
                : registroEditado.procesos ? [String(registroEditado.procesos)] : [];
              const insumosIds = Array.isArray(registroEditado.insumos)
                ? registroEditado.insumos.filter(Boolean).map(String)
                : registroEditado.insumos ? [String(registroEditado.insumos)] : [];
              const areaId = registroEditado.areaProduccion;
              const maquinaId = registroEditado.maquina;              if (!procesosIds || procesosIds.length === 0 || !areaId || !maquinaId || !insumosIds || insumosIds.length === 0) {
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
              }              const datosActualizados = {
                _id: currentProduccionId,
                oti: numeroOtiOriginalFormulario,
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
              };              // --- BEGIN ADDED LOGS ---
              console.log("Frontend: currentProduccionId", currentProduccionId);
              console.log("Frontend: numeroOtiOriginalFormulario", numeroOtiOriginalFormulario);
              console.log("Frontend: datosActualizados", datosActualizados);
              // --- END ADDED LOGS ---

              const response = await axiosInstance.put(`/produccion/actualizar/${currentProduccionId}`, datosActualizados);

              console.log("Backend response:", response.data);

              if (response.status >= 200 && response.status < 300) {
                toast.success("✅ Producción actualizada con éxito");                if (response.data && response.data.produccion) {
                  const produccionActualizadaBackend = response.data.produccion;

                  console.log("Backend returned produccion:", produccionActualizadaBackend);
                  console.log("Backend returned OTI:", produccionActualizadaBackend.oti);

                  // Preparar datos para setProduccionLocal, preservando la estructura OTI del backend
                  const nuevaProduccionLocal = {
                    ...produccionActualizadaBackend,
                    // Preservar la estructura OTI que viene del backend (que ya está populada)
                    oti: produccionActualizadaBackend.oti && produccionActualizadaBackend.oti.numeroOti 
                      ? produccionActualizadaBackend.oti 
                      : { numeroOti: numeroOtiOriginalFormulario }
                  };

                  console.log("Processed nuevaProduccionLocal OTI:", nuevaProduccionLocal.oti);
                  
                  setProduccionLocal(nuevaProduccionLocal);// También actualizar el formulario de edición para reflejar los datos guardados
                  // y mantener la consistencia, especialmente el OTI.
                  setRegistroEditado({
                    ...nuevaProduccionLocal, // Start with the updated local data (which includes correct OTI structure)
                    // Ensure all fields for the form are correctly set and formatted for display
                    fecha: nuevaProduccionLocal.fecha ? new Date(nuevaProduccionLocal.fecha).toISOString().split('T')[0] : "",
                    // oti: use the correct OTI structure from nuevaProduccionLocal
                    oti: nuevaProduccionLocal.oti || { numeroOti: numeroOtiOriginalFormulario },
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

  // Helper component for required field labels
  const RequiredLabel = ({ htmlFor, children, required = false }) => (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const renderContent = () => {    if (isLoading) {
      return (
        <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-4 sm:py-8">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-700 mb-4"></div>
            <h2 className="text-lg sm:text-2xl font-bold text-center text-blue-700">Cargando Datos...</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2 text-center">Por favor espere mientras cargamos la información</p>
          </div>
        </Card>
      );
    }

    if (error) { 
      return (
        <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-red-700 mb-2">{error}</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Ha ocurrido un error al cargar los datos</p>
            <Button 
              onClick={() => { if (onClose) onClose(); else navigate(-1); }} 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
            >
              {onClose ? 'Cerrar' : 'Volver'}
            </Button>
          </div>
        </Card>
      );
    }
    
      if (!produccionLocal && ((!paramId && !produccionProp && invokedAsModal) || (!paramId && !invokedAsModal))) {
        return (
            <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-red-700 mb-2">No hay datos de producción para editar</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-6">No se encontraron datos de producción válidos</p>
                    <Button 
                        onClick={() => { if (onClose) onClose(); else navigate(-1); }} 
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
                    >
                        {onClose ? 'Cerrar' : 'Volver'}
                    </Button>
                </div>
            </Card>
        );
    }

   
    if (!produccionLocal) {
        return (
            <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-red-700 mb-2">Datos no disponibles</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-6">Los datos de producción no están disponibles en este momento</p>
                    <Button 
                        onClick={() => { if (onClose) onClose(); else navigate(-1); }} 
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
                    >
                        {onClose ? 'Cerrar' : 'Volver'}
                    </Button>
                </div>
            </Card>
        );
    }
    return (      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl bg-white transform transition-all duration-300 scale-100 opacity-100 translate-y-0 animate-fade-in-up border border-blue-100">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-blue-700 tracking-tight">Editar Producción</h2>
        
        {/* Required fields note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-blue-800">
            <span className="text-red-500 font-semibold">*</span> Campos obligatorios
          </p>
        </div>
        
        <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>{/* OTI y Fecha en grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="oti">OTI</RequiredLabel>
              <Input
                id="oti"
                value={registroEditado.oti?.numeroOti || ''}
                onChange={(e) => setRegistroEditado(prev => ({ ...prev, oti: { ...prev.oti, numeroOti: e.target.value } }))}
                className="focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="fecha" required>Fecha</RequiredLabel>
              <Input
                id="fecha"
                type="date"
                value={registroEditado.fecha?.split('T')[0] || ''}
                onChange={handleChange}
                name="fecha"
                className="focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                required
              />
            </div>
          </div>          {/* Área de Producción */}
          <div className="space-y-2">
            <RequiredLabel htmlFor="areaProduccion" required>Área de Producción</RequiredLabel>
            <select
              id="areaProduccion"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-sm sm:text-base px-3 py-2"
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

          {/* Procesos e Insumos en grid responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">            <div className="space-y-2">
              <RequiredLabel htmlFor="procesos" required>Proceso(s)</RequiredLabel>
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
                  : []}                onChange={(selectedOptions, actionMeta) => handleChangeRelacion(selectedOptions, { name: 'procesos', action: actionMeta.action })}
                className="w-full basic-multi-select"
                classNamePrefix="select"
                placeholder="Seleccionar Proceso(s)"
                isDisabled={!registroEditado.areaProduccion || (availableProcesos && availableProcesos.length === 0)}
                styles={getSelectStyles()}
                required
              />
            </div>            <div className="space-y-2">
              <RequiredLabel htmlFor="insumos" required>Insumo(s)</RequiredLabel>
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
                  : []}                onChange={(selectedOptions, actionMeta) => handleChangeRelacion(selectedOptions, { name: 'insumos', action: actionMeta.action })}
                className="w-full basic-multi-select"
                classNamePrefix="select"
                placeholder="Seleccionar Insumo(s)"
                styles={getSelectStyles()}
                required
              />
            </div>
          </div>

          {/* Máquina y Tipo de Tiempo en grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">            <div className="space-y-2">
              <RequiredLabel htmlFor="maquina" required>Máquina</RequiredLabel>
              <select
                id="maquina"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-sm sm:text-base px-3 py-2"
                value={registroEditado.maquina || ''}
                onChange={handleChangeRelacion}
                name="maquina"
              >
                <option value="">Seleccionar Máquina</option>
                {maquinas.map((maquina) => (
                  <option key={maquina._id} value={maquina._id}>{maquina.nombre}</option>
                ))}
              </select>
            </div>            <div className="space-y-2">
              <RequiredLabel htmlFor="tipoTiempo" required>Tipo de Tiempo</RequiredLabel>
              <select
                id="tipoTiempo"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-sm sm:text-base px-3 py-2"
                value={registroEditado.tipoTiempo || ''}
                onChange={handleChangeRelacion}
                name="tipoTiempo"
                required
              >                <option value="">Seleccionar Tipo de Tiempo</option>
                <option value="Preparación">Preparación</option>
                <option value="Operación">Operación</option>
                <option value="Alimentación">Alimentación</option>
              </select>
            </div>
          </div>          {/* Horas en grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="horaInicio" required>Hora Inicio</RequiredLabel>
              <Input
                id="horaInicio"
                type="time"
                value={registroEditado.horaInicio || ''}
                onChange={handleChange}
                name="horaInicio"
                className="focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="horaFin" required>Hora Fin</RequiredLabel>
              <Input
                id="horaFin"
                type="time"
                value={registroEditado.horaFin || ''}
                onChange={handleChange}
                name="horaFin"
                className="focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                required
              />
            </div>
          </div>          {/* Tiempo calculado */}
          <div className="space-y-2">
            <label htmlFor="tiempo" className="block text-sm font-semibold text-gray-700">Tiempo (minutos)</label>
            <Input
              id="tiempo"
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
              className="focus:ring-2 focus:ring-blue-400 bg-gray-100 cursor-not-allowed text-sm sm:text-base"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <label htmlFor="observaciones" className="block text-sm font-semibold text-gray-700">Observaciones</label>
            <textarea
              id="observaciones"
              value={registroEditado.observaciones || ''}
              onChange={handleChange}
              name="observaciones"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-sm sm:text-base resize-none"
              placeholder="Ingrese observaciones adicionales..."
            />
          </div>

          {/* Botones responsive */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-5">
            <Button
              type="submit"
              className="order-2 sm:order-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg shadow-md transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              Guardar Cambios
            </Button>
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => {
                if (onClose) onClose();
                else if (paramId) navigate(-1); 
                else navigate('/operario-dashboard'); 
              }} 
              className="order-1 sm:order-2 border-gray-300 px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
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
      <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center overflow-y-auto p-2 sm:p-4">
        {/* Backdrop mejorado */}
        <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-300" onClick={onClose} />
        
        {/* Contenedor del modal con scroll seguro */}
        <div className="relative w-full max-h-screen overflow-y-auto py-4 sm:py-8">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 flex flex-col justify-center items-center p-2 sm:p-4">
      {renderContent()} 
    </div>
  );
}

export default EditarProduccion;