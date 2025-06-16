import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Sidebar } from "../components/Sidebar";
import { Input, Textarea, Button, Card } from "../components/ui/index";
import Select from 'react-select';
import { 
  Clock, 
  Calendar, 
  User, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Moon,
  Timer,
  Zap
} from 'lucide-react';

// Componente separado para cada actividad
const ActividadCard = ({ 
  actividad, 
  index, 
  onActividadChange, 
  onRemove, 
  areasProduccionData, 
  maquinasData, 
  insumosData,
  canRemove = false 
}) => {
  const [tiempoCalculado, setTiempoCalculado] = useState(0);
  const [cruzaMedianoche, setCruzaMedianoche] = useState(false);

  // Calcular tiempo en tiempo real
  useEffect(() => {
    if (actividad.horaInicio && actividad.horaFin) {
      const inicio = new Date(`1970-01-01T${actividad.horaInicio}:00`);
      let fin = new Date(`1970-01-01T${actividad.horaFin}:00`);
      
      const esCruzaMedianoche = fin <= inicio;
      setCruzaMedianoche(esCruzaMedianoche);
      
      if (esCruzaMedianoche) {
        fin = new Date(`1970-01-02T${actividad.horaFin}:00`);
      }
      
      if (fin > inicio) {
        const minutos = Math.floor((fin - inicio) / 60000);
        setTiempoCalculado(minutos);
      } else {
        setTiempoCalculado(0);
      }
    } else {
      setTiempoCalculado(0);
      setCruzaMedianoche(false);
    }
  }, [actividad.horaInicio, actividad.horaFin]);

  const formatTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };  return (
    <Card className="relative p-6 border-l-4 border-l-blue-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg border border-gray-100">
      {/* Header con gradiente */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">          
          <div>
            <h3 className="text-lg font-bold text-gray-800">Actividad N° {index + 1}</h3>
            <p className="text-xs text-gray-500">Registro de tiempo de producción</p>
          </div>
        </div>
        {canRemove && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 h-9 w-9 p-0 rounded-lg transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>      <div className="space-y-6">
        {/* Sección de Información Básica */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-60 p-4 rounded-xl border border-gray-200">          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                OTI *
              </label>
              <Input
                type="text"
                name="oti"
                value={actividad.oti}
                onChange={(e) => onActividadChange(index, e)}
                placeholder="Número de OTI"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Área de Producción *
              </label>
              <Input
                as="select"
                name="areaProduccion"
                value={actividad.areaProduccion}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar área...</option>
                {areasProduccionData.map(area => (
                  <option key={area._id} value={area._id}>{area.nombre}</option>
                ))}
              </Input>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Proceso(s) *
              </label>
              <Select
                isMulti
                name="procesos"
                options={actividad.availableProcesos?.map(p => ({ value: p._id, label: p.nombre })) || []}
                value={actividad.procesos
                  ?.map(pId => {
                    const procesoInfo = actividad.availableProcesos?.find(ap => ap._id === pId);
                    return procesoInfo ? { value: procesoInfo._id, label: procesoInfo.nombre } : null;
                  })
                  .filter(p => p !== null) || []}
                onChange={(selectedOptions, actionMeta) => onActividadChange(index, selectedOptions, actionMeta)}
                placeholder="Seleccionar proceso(s)..."
                isDisabled={!actividad.areaProduccion}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '40px',
                    fontSize: '14px',
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                    borderRadius: '8px',
                    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                    '&:hover': { borderColor: '#3b82f6' }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#1e40af',
                    fontSize: '12px'
                  })
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Máquina *
              </label>
              <Input
                as="select"
                name="maquina"
                value={actividad.maquina}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar máquina...</option>
                {maquinasData
                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                  .map(maquina => (
                    <option key={maquina._id} value={maquina._id}>{maquina.nombre}</option>
                  ))}
              </Input>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Insumo(s) *
              </label>
              <Select
                isMulti
                name="insumos"
                options={insumosData.map(i => ({ value: i._id, label: i.nombre }))}
                value={actividad.insumos
                  ?.map(iId => {
                    const insumoInfo = insumosData.find(ins => ins._id === iId);
                    return insumoInfo ? { value: insumoInfo._id, label: insumoInfo.nombre } : null;
                  })
                  .filter(i => i !== null) || []}
                onChange={(selectedOptions, actionMeta) => onActividadChange(index, selectedOptions, actionMeta)}
                placeholder="Seleccionar insumo(s)..."
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '40px',
                    fontSize: '14px',
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                    borderRadius: '8px',
                    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                    '&:hover': { borderColor: '#3b82f6' }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#f3e8ff',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#7c3aed',
                    fontSize: '12px'
                  })
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Tipo de Tiempo *
              </label>
              <Input
                as="select"
                name="tipoTiempo"
                value={actividad.tipoTiempo}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar tipo...</option>
                <option value="Operación">Operación</option>
                <option value="Preparación">Preparación</option>
                <option value="Alimentación">Alimentación</option>
              </Input>
            </div>
             <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Hora Inicio *
              </label>
              <Input
                type="time"
                name="horaInicio"
                value={actividad.horaInicio}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-11 text-sm border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Hora Fin *
              </label>
              <Input
                type="time"
                name="horaFin"
                value={actividad.horaFin}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-11 text-sm border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <Timer className="w-3 h-3 text-green-600" />
                Tiempo Calculado
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-mono text-sm shadow-sm">
                  {tiempoCalculado > 0 ? `${tiempoCalculado} min (${formatTiempo(tiempoCalculado)})` : '0 min'}
                </div>
                {cruzaMedianoche && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <Moon className="w-3 h-3" />
                    <span className="hidden sm:inline">Cruza medianoche</span>
                  </div>
                )}
              </div>
            </div>            
          </div>
          {/* Observaciones */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <h4 className="font-semibold text-gray-700 text-sm">Observaciones</h4>
          </div>
          <Textarea
            name="observaciones"
            value={actividad.observaciones || ''}
            onChange={(e) => onActividadChange(index, e)}
            placeholder="Notas adicionales sobre la actividad..."
            rows={3}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm border-gray-300 rounded-lg"
          />        
        </div> 
      </div>
    </Card>
  );
};

// Componente principal mejorado
export default function RegistroProduccion() {
  const { jornadaId: urlJornadaId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nombreOperario, setNombreOperario] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // Para wizard steps
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  
  const [jornadaData, setJornadaData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: "",
    horaFin: "",
    operario: ""
  });

  const [actividades, setActividades] = useState([
    {
      oti: "",
      procesos: [],
      areaProduccion: "",
      maquina: "",
      insumos: [],
      tipoTiempo: "",
      horaInicio: "",
      horaFin: "",
      tiempo: 0,
      observaciones: "",
      availableProcesos: []
    }
  ]);

  const [actividadesExistentes, setActividadesExistentes] = useState([]);
  const [maquinasData, setMaquinasData] = useState([]);
  const [areasProduccionData, setAreasProduccionData] = useState([]);
  const [insumosData, setInsumosData] = useState([]);
  const [actividadesResumen, setActividadesResumen] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(false);
  // Inicialización y carga de datos
  useEffect(() => {
    const loadInitialData = async () => {
      const operario = localStorage.getItem("operario");
      if (!operario) {
        toast.error("No tienes acceso. Valida cédula.");
        navigate("/validate-cedula");
        return;
      }

      try {
        const operarioData = JSON.parse(operario);
        if (operarioData?.name) setNombreOperario(operarioData.name);
        if (operarioData?._id || operarioData?.id) {
          setJornadaData(prev => ({ ...prev, operario: operarioData._id || operarioData.id }));
        }
      } catch (error) {
        toast.error("No se pudo leer la información del operario. Por favor, vuelve a validar tu cédula.");
      }

      // Cargar datos de selectores
      try {
        const maquinasRes = await fetch("http://localhost:5000/api/produccion/maquinas");
        if (maquinasRes.ok) setMaquinasData(await maquinasRes.json());
        else toast.error("No se pudieron cargar las máquinas. Intenta de nuevo más tarde.");

        const areasRes = await fetch("http://localhost:5000/api/produccion/areas");
        if (areasRes.ok) setAreasProduccionData(await areasRes.json());

        const insumosRes = await fetch("http://localhost:5000/api/produccion/insumos");
        if (insumosRes.ok) setInsumosData(await insumosRes.json());
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }

      // Lógica principal para obtener o crear la jornada
      if (urlJornadaId) {
        try {
          const res = await fetch(`http://localhost:5000/api/jornadas/${urlJornadaId}`);
          if (res.ok) {
            const jornada = await res.json();

            // Normalizar actividades existentes
            if (Array.isArray(jornada.registros)) {
              const actividadesNorm = jornada.registros.map(act => ({
                ...act,
                horaInicio: act.horaInicio
                  ? new Date(act.horaInicio).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                  : "",
                horaFin: act.horaFin
                  ? new Date(act.horaFin).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                  : "",
                tiempo: act.tiempo || 0,
                availableProcesos: Array.isArray(act.procesosInfo) ? act.procesosInfo : [],
              }));
              setActividadesExistentes(actividadesNorm);
              setActividades(actividadesNorm.length > 0 ? actividadesNorm : [actividades[0]]);

              // Cargar procesos para cada actividad existente
              actividadesNorm.forEach((act, index) => {
                if (act.areaProduccion) {
                  fetchProcesosForActivity(index, act.areaProduccion);
                }
              });
            }

            // Establecer fecha de la jornada
            if (jornada.fecha) {
              let fechaStr = jornada.fecha;
              if (typeof fechaStr === "string" && fechaStr.length > 10) {
                fechaStr = fechaStr.substring(0, 10);
              }
              setJornadaData(prev => ({ ...prev, fecha: fechaStr }));
            }
          }
        } catch (error) {
          toast.error("No se pudieron cargar las actividades de la jornada. Intenta de nuevo más tarde.");
        }
      }
    };

    loadInitialData();
  }, [navigate, urlJornadaId]);

  // Cargar resumen de actividades
  useEffect(() => {
    const fetchActividadesResumen = async () => {
      if (jornadaData.fecha && jornadaData.operario && !urlJornadaId) {
        setLoadingResumen(true);
        try {
          const response = await fetch(`http://localhost:5000/api/jornadas/operario/${jornadaData.operario}?fecha=${jornadaData.fecha}`);
          if (!response.ok) {
            if (response.status === 404) {
              setActividadesResumen([]);
            } else {
              toast.error("Error al cargar resumen de actividades.");
              setActividadesResumen([]);
            }
          } else {
            const jornadasDelDiaFetched = await response.json();

            if (jornadasDelDiaFetched && jornadasDelDiaFetched.length > 0) {
              const selectedDateStr = jornadaData.fecha;

              let todasLasActividadesDelDia = jornadasDelDiaFetched
                .filter(jornada => {
                  if (!jornada.fecha) return false;
                  const backendJornadaDateStr = jornada.fecha.split('T')[0];
                  return backendJornadaDateStr === selectedDateStr;
                })
                .reduce((acc, jornada) => {
                  const actividadesDeJornada = jornada.registros || [];
                  return acc.concat(actividadesDeJornada.map(act => ({
                    ...act,
                    fechaJornada: jornada.fecha,
                    otiNumero: act.oti?.numeroOti || "N/A",
                    procesosNombres: Array.isArray(act.procesos) ? act.procesos.map(p => p.nombre).join(', ') : "N/A"
                  })));
                }, []);

              todasLasActividadesDelDia.sort((a, b) => {
                const dateA = a.horaInicio ? new Date(a.horaInicio) : null;
                const dateB = b.horaInicio ? new Date(b.horaInicio) : null;
                
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                
                return dateA.getTime() - dateB.getTime();
              });

              setActividadesResumen(todasLasActividadesDelDia);
            } else {
              setActividadesResumen([]);
            }
          }
        } catch (error) {
          toast.error("No se pudo cargar el resumen de actividades.");
          setActividadesResumen([]);
        } finally {
          setLoadingResumen(false);
        }
      } else {
        setActividadesResumen([]);
      }
    };

    fetchActividadesResumen();
  }, [jornadaData.fecha, jornadaData.operario, urlJornadaId]);

  // Calcular horaInicio y horaFin de la jornada
  useEffect(() => {
    const todas = [...actividadesExistentes, ...actividades];
    const horasInicio = todas.map(a => a.horaInicio).filter(Boolean);
    const horasFin = todas.map(a => a.horaFin).filter(Boolean);
    let primeraHora = "";
    let ultimaHora = "";

    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    if (horasInicio.length > 0) {
      primeraHora = horasInicio.sort((a, b) => parseTime(a) - parseTime(b))[0];
    }
    if (horasFin.length > 0) {
      ultimaHora = horasFin.sort((a, b) => parseTime(a) - parseTime(b))[horasFin.length - 1];
    }

    setJornadaData(prev => ({
      ...prev,
      horaInicio: primeraHora,
      horaFin: ultimaHora
    }));
  }, [actividades, actividadesExistentes]);

  // Control de visibilidad del botón flotante basado en scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldShow = scrollTop > 300; // Mostrar después de 300px de scroll
      setShowFloatingButton(shouldShow);
    };

    // Agregar el listener
    window.addEventListener('scroll', handleScroll);
    
    // Mostrar el botón inicialmente después de un pequeño delay
    const timer = setTimeout(() => {
      setShowFloatingButton(true);
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const parseLocalDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day);
      }
    }
    return null;
  };

  const fetchProcesosForActivity = useCallback(async (activityIndex, areaId) => {
    if (!areaId) {
      setActividades(prev =>
        prev.map((act, idx) =>
          idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
        )
      );
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
        } else {
          determinedProcesos = [];
        }

        setActividades(prev =>
          prev.map((act, idx) => {
            if (idx === activityIndex) {
              return { ...act, availableProcesos: determinedProcesos, procesos: [] };
            }
            return act;
          })
        );
      } else {
        toast.error("Error al cargar procesos para el área seleccionada.");
        setActividades(prev =>
          prev.map((act, idx) =>
            idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
          )
        );
      }
    } catch (error) {
      toast.error("No se pudieron cargar los procesos. Intenta de nuevo más tarde.");
      setActividades(prev =>
        prev.map((act, idx) =>
          idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
        )
      );
    }
  }, []);

  const handleActividadChange = (index, e_or_selectedOptions, actionMeta) => {
    let name, value;

    if (actionMeta && actionMeta.name) {
      name = actionMeta.name;
      value = e_or_selectedOptions ? e_or_selectedOptions.map(option => option.value) : [];
    } else {
      name = e_or_selectedOptions.target.name;
      value = e_or_selectedOptions.target.value;
    }

    const nuevasActividades = actividades.map((act, idx) => {
      if (idx === index) {
        let updatedAct = { ...act };

        if (name === 'areaProduccion') {
          updatedAct.areaProduccion = value;
          updatedAct.procesos = [];
          updatedAct.availableProcesos = [];
          fetchProcesosForActivity(index, value);
        } else if (name === 'procesos') {
          updatedAct.procesos = value;
        } else if (name === 'insumos') {
          updatedAct.insumos = value;
        } else if (name === 'horaInicio' || name === 'horaFin') {
          updatedAct[name] = value;
          // Calcular tiempos de inicio y fin
          const inicio = updatedAct.horaInicio;
          const fin = updatedAct.horaFin;
          if (inicio && fin) {
            const inicioDate = new Date(`1970-01-01T${inicio}:00`);
            let finDate = new Date(`1970-01-01T${fin}:00`);
            
            // Manejar cruce de medianoche: si fin <= inicio, asumir que fin es del día siguiente
            if (finDate <= inicioDate) {
              finDate = new Date(`1970-01-02T${fin}:00`);
            }
            
            if (finDate > inicioDate) {
              updatedAct.tiempo = Math.floor((finDate - inicioDate) / 60000);
            } else {
              updatedAct.tiempo = 0;
            }
          } else {
            updatedAct.tiempo = 0;
          }
        } else {
          updatedAct[name] = value;
        }
        return updatedAct;
      }
      return act;
    });
    setActividades(nuevasActividades);
  };

  const combinarFechaYHora = (fecha, hora) => {
    if (!hora || typeof hora !== 'string' || !hora.match(/^\d{2}:\d{2}$/)) return null;

    const [hh, mm] = hora.split(":");
    const [yyyy, mmFecha, dd] = fecha.split('-');

    const date = new Date(Number(yyyy), Number(mmFecha) - 1, Number(dd), Number(hh), Number(mm), 0);

    return isNaN(date.getTime()) ? null : date.toISOString();
  };
  const addActividad = () => {
    setActividades(prev => [...prev, {
      oti: "",
      procesos: [],
      areaProduccion: "",
      maquina: "",
      insumos: [],
      tipoTiempo: "",
      horaInicio: "",
      horaFin: "",
      tiempo: 0,
      observaciones: "",
      availableProcesos: []
    }]);
    
    // Mostrar mensaje de confirmación con toast
    toast.success(`✨ Nueva actividad agregada! Total: ${actividades.length + 1}`, {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Scroll suave hacia la nueva actividad después de un pequeño delay
    setTimeout(() => {
      const elements = document.querySelectorAll('[class*="ActividadCard"]');
      const lastElement = elements[elements.length - 1];
      if (lastElement) {
        lastElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  const removeActividad = (index) => {
    if (actividades.length > 1) {
      setActividades(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.warn("Debe haber al menos una actividad.");
    }
  };

  const handleSubmitJornada = async (e) => {
    e.preventDefault();
    setCurrentStep(3);

    // Validaciones
    if (!actividades || actividades.length === 0) {
      toast.error("Debe agregar al menos una actividad para guardar la jornada.");
      return;
    }    for (let i = 0; i < actividades.length; i++) {
      const actividad = actividades[i];
      const camposFaltantes = [];
      
      if (!actividad.oti) camposFaltantes.push('OTI');
      if (!actividad.areaProduccion) camposFaltantes.push('Área de Producción');
      if (!actividad.maquina) camposFaltantes.push('Máquina');
      if (!actividad.procesos || actividad.procesos.length === 0) camposFaltantes.push('Proceso(s)');
      if (!actividad.insumos || actividad.insumos.length === 0) camposFaltantes.push('Insumo(s)');
      if (!actividad.tipoTiempo) camposFaltantes.push('Tipo de Tiempo');
      if (!actividad.horaInicio) camposFaltantes.push('Hora de Inicio');
      if (!actividad.horaFin) camposFaltantes.push('Hora de Fin');
      
      if (camposFaltantes.length > 0) {
        toast.error(`Actividad ${i + 1}: Faltan los siguientes campos: ${camposFaltantes.join(', ')}`);
        return;
      }
    }

    if (!jornadaData.horaInicio || !jornadaData.horaFin) {
      toast.error("Horas de inicio o fin de jornada vacías.");
      return;
    }

    setLoading(true);

    const dataToSend = {
      ...jornadaData,
      fecha: jornadaData.fecha,
      horaInicio: combinarFechaYHora(jornadaData.fecha, jornadaData.horaInicio),
      horaFin: combinarFechaYHora(jornadaData.fecha, jornadaData.horaFin),
      actividades: actividades.map(actividad => ({
        oti: actividad.oti,
        areaProduccion: actividad.areaProduccion,
        maquina: actividad.maquina,
        procesos: actividad.procesos,
        insumos: actividad.insumos || [],
        tipoTiempo: actividad.tipoTiempo,
        horaInicio: actividad.horaInicio && actividad.horaInicio !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaInicio) : null,
        horaFin: actividad.horaFin && actividad.horaFin !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaFin) : null,
        tiempo: actividad.tiempo || 0,
        observaciones: actividad.observaciones || null
      }))
    };

    try {
      const endpoint = urlJornadaId
        ? `http://localhost:5000/api/jornadas/${urlJornadaId}`
        : "http://localhost:5000/api/jornadas/completa";
      const method = urlJornadaId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error del backend:', result);
        toast.error(`Error al guardar la jornada: ${result.error || result.msg || "Error inesperado"}`);
        setLoading(false);
        return;
      }      toast.success("Jornada guardada exitosamente");
      navigate("/historial-jornadas");
    } catch (error) {
      console.error('Error en la petición:', error);
      toast.error("No se pudo guardar la jornada. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }  };

  return (
    <div className="flex bg-gray-100 min-h-screen h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
          <div className="container mx-auto py-8 max-w-7xl space-y-4 pb-24">                   
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
                Registro de Tiempos de Producción
              </h1>              
            </div>
               <form onSubmit={handleSubmitJornada} className="space-y-4">{/* Información de la jornada */}
                <Card className="p-3 shadow-lg bg-white border border-gray-200 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-m font-semibold text-gray-700">Operario Asignado</label>
                      <Input 
                        type="text" 
                        value={nombreOperario || "Cargando..."} 
                        disabled 
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 h-11 text-m rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-m font-semibold text-gray-700">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Fecha de la Jornada *
                      </label>
                      <Input 
                        type="date" 
                        name="fecha" 
                        value={jornadaData.fecha} 
                        onChange={(e) => {
                          setJornadaData(prev => ({ ...prev, fecha: e.target.value }));
                          setCurrentStep(2); // Move to step 2 when date is selected
                        }}
                        required 
                        className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-11 text-m border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
              </Card>{/* Resumen de actividades existentes con diseño de tabla */}
              {!urlJornadaId && actividadesResumen.length > 0 && (
                <div className="bg-gradient-to-r from-gray-600 to-gray-800 border border-gray-200 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500 p-2 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Actividades Registradas
                        </h3>
                        <p className="text-white text-sm">
                          {actividadesResumen.length} actividad{actividadesResumen.length !== 1 ? 'es' : ''} ya registradas para esta fecha
                        </p>
                      </div>
                    </div>
                    <div className="text-right">                      
                      <p className="text-lg font-semibold text-white mt-1">
                        {parseLocalDate(jornadaData.fecha)?.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                    {/* Tabla de actividades existentes */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Proceso
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              # OTI
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Hora Inicio
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Hora Fin
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Duración
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {actividadesResumen.map((act, index) => {
                            // Calcular duración
                            const calcularDuracion = (horaInicio, horaFin) => {
                              if (!horaInicio || !horaFin) return 'N/A';
                              const inicio = new Date(horaInicio);
                              const fin = new Date(horaFin);
                              const diffMs = fin - inicio;
                              const diffMinutos = Math.floor(diffMs / (1000 * 60));
                              const horas = Math.floor(diffMinutos / 60);
                              const minutos = diffMinutos % 60;
                              return `${horas}h ${minutos}m`;
                            };

                            return (
                              <tr 
                                key={act._id} 
                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                    <span className="text-sm font-semibold text-gray-800">
                                      {act.procesosNombres || 'N/A'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                    {act.otiNumero || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-gray-900 font-mono">
                                    {act.horaInicio ? new Date(act.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-gray-900 font-mono">
                                    {act.horaFin ? new Date(act.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {calcularDuracion(act.horaInicio, act.horaFin)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>              )}              {/* Actividades */}
              <div className="space-y-4">
                {actividades.map((actividad, index) => (
                  <ActividadCard
                    key={index}
                    actividad={actividad}
                    index={index}
                    onActividadChange={handleActividadChange}
                    onRemove={removeActividad}
                    areasProduccionData={areasProduccionData}
                    maquinasData={maquinasData}
                    insumosData={insumosData}
                    canRemove={actividades.length > 1}
                  />
                ))}
              </div>{/* Botones de acción */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                    <Save className="w-5 h-5 text-white" />
                  </div>                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Guardar Jornada</h2>
                    <p className="text-sm text-gray-600">Guarda todas las actividades registradas en esta jornada</p>
                  </div>
                </div>
                  <div className="flex justify-center items-center">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-base h-11 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando Jornada...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </div>            </form>
          </div>
        </div>
          {/* Botón Flotante para Agregar Actividad */}
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
          showFloatingButton 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
        }`}>
          <div className="relative">
            {/* Botón principal */}
            <button
              type="button"
              onClick={addActividad}
              className="group relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-purple-500 hover:border-purple-400"
              aria-label="Agregar nueva actividad"
            >
              {/* Efecto de pulso de fondo */}
              <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20"></div>
              
              {/* Icono principal con animación */}
              <div className="relative flex items-center justify-center">
                <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-180" />
              </div>
              
              {/* Tooltip mejorado */}
              <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform group-hover:translate-y-0 translate-y-2">
                <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-gray-700">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">Nueva Actividad</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Click para agregar
                  </div>
                  {/* Flecha del tooltip */}
                  <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </button>
              {/* Contador de actividades con animación */}
            {actividades.length > 0 && (
              <button
                onClick={scrollToTop}
                className="absolute -top-2 -left-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-lg border-2 border-white animate-bounce hover:animate-none transition-all duration-200 hover:scale-110"
                title="Ir al inicio"
              >
                {actividades.length}
              </button>
            )}
            
            
          </div>
        </div>
      </div>    
  );
}
