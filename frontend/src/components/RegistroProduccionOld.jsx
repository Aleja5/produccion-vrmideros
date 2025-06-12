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
  Timer
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
  };
  return (
    <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-800">Actividad #{index + 1}</h3>
        </div>
        {canRemove && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="space-y-3">        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              OTI *
            </label>
            <Input
              type="text"
              name="oti"
              value={actividad.oti}
              onChange={(e) => onActividadChange(index, e)}
              placeholder="Número de OTI"
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Área de Producción *
            </label>
            <Input
              as="select"
              name="areaProduccion"
              value={actividad.areaProduccion}
              onChange={(e) => onActividadChange(index, e)}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              required
            >
              <option value="">Seleccionar área...</option>
              {areasProduccionData.map(area => (
                <option key={area._id} value={area._id}>{area.nombre}</option>
              ))}
            </Input>
          </div>
        </div>        {/* Proceso y Máquina */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
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
              isDisabled={!actividad.areaProduccion}              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: '36px',
                  fontSize: '14px',
                  borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                  '&:hover': { borderColor: '#3b82f6' }
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#eff6ff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#1e40af',
                  fontSize: '12px'
                })
              }}
            />
          </div>          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Máquina *
            </label>
            <Input
              as="select"
              name="maquina"
              value={actividad.maquina}
              onChange={(e) => onActividadChange(index, e)}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
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
        </div>        {/* Insumos y Tipo de Tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
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
              placeholder="Seleccionar insumo(s)..."              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: '36px',
                  fontSize: '14px',
                  borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                  '&:hover': { borderColor: '#3b82f6' }
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#f3e8ff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#7c3aed',
                  fontSize: '12px'
                })
              }}
            />
          </div>          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Tipo de Tiempo *
            </label>
            <Input
              as="select"
              name="tipoTiempo"
              value={actividad.tipoTiempo}
              onChange={(e) => onActividadChange(index, e)}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              required
            >
              <option value="">Seleccionar tipo...</option>
              <option value="Operación">Operación</option>
              <option value="Preparación">Preparación</option>
              <option value="Alimentación">Alimentación</option>
            </Input>
          </div>
        </div>        {/* Horarios y Tiempo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm">Horarios</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                Hora Inicio *
              </label>
              <Input
                type="time"
                name="horaInicio"
                value={actividad.horaInicio}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                Hora Fin *
              </label>
              <Input
                type="time"
                name="horaFin"
                value={actividad.horaFin}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
                <Timer className="w-3 h-3 text-green-600" />
                Tiempo Calculado
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-2 py-1.5 bg-white border border-gray-300 rounded-md font-mono text-xs">
                  {tiempoCalculado > 0 ? `${tiempoCalculado} min (${formatTiempo(tiempoCalculado)})` : '0 min'}
                </div>
                {cruzaMedianoche && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs">
                    <Moon className="w-3 h-3" />
                    <span className="hidden sm:inline">Cruza medianoche</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>        {/* Observaciones */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            Observaciones
          </label>
          <Textarea
            name="observaciones"
            value={actividad.observaciones || ''}
            onChange={(e) => onActividadChange(index, e)}
            placeholder="Notas adicionales sobre la actividad..."
            rows={2}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none text-sm"
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
      }

      toast.success("Jornada guardada exitosamente");
      if (!urlJornadaId) {
        navigate("/operario-dashboard");
      } else {
        navigate("/mi-jornada");
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      toast.error("No se pudo guardar la jornada. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitActividad = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    const actividad = actividades[0];
    const camposFaltantes = [];    // Validar campos obligatorios
    if (!actividad.oti) camposFaltantes.push('OTI');
    if (!actividad.areaProduccion) camposFaltantes.push('Área de Producción');
    if (!actividad.maquina) camposFaltantes.push('Máquina');
    if (!actividad.procesos || actividad.procesos.length === 0) camposFaltantes.push('Proceso(s)');
    if (!actividad.insumos || actividad.insumos.length === 0) camposFaltantes.push('Insumo(s)');
    if (!actividad.tipoTiempo) camposFaltantes.push('Tipo de Tiempo');
    if (!actividad.horaInicio) camposFaltantes.push('Hora de Inicio');
    if (!actividad.horaFin) camposFaltantes.push('Hora de Fin');

    if (camposFaltantes.length > 0) {
      toast.error(`Faltan los siguientes campos obligatorios: ${camposFaltantes.join(', ')}`);
      setLoading(false);
      return;
    }

    if (!Array.isArray(actividad.procesos)) {
      toast.error("Error interno: formato de procesos incorrecto.");
      setLoading(false);
      return;
    }
    if (!Array.isArray(actividad.insumos)) {
      toast.error("Error interno: formato de insumos incorrecto.");
      setLoading(false);
      return;
    }

    const horaInicio = combinarFechaYHora(jornadaData.fecha, actividad.horaInicio);
    const horaFin = combinarFechaYHora(jornadaData.fecha, actividad.horaFin);

    if (!horaInicio || !horaFin) {
      toast.error("Las horas de inicio o fin de la actividad no son válidas o la fecha de jornada no está definida.");
      setLoading(false);
      return;
    }

    const actividadToSend = {
      ...actividad,
      fecha: jornadaData.fecha,
      horaInicio,
      horaFin,
      tiempo: actividad.tiempo || 0,
      operario: jornadaData.operario,
    };

    try {
      const response = await fetch("http://localhost:5000/api/produccion/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actividadToSend)
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(`Error al guardar la actividad: ${result.msg || result.error || "Error inesperado"}`);
        return;
      }

      toast.success("Actividad guardada exitosamente");
      navigate("/mi-jornada");
    } catch (error) {
      toast.error("No se pudo guardar la actividad. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-50 to-blue-50 h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header mejorado */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Registro de Producción
                  </h1>
                  <p className="text-gray-600">
                    {urlJornadaId ? 'Editando jornada existente' : 'Crear nueva jornada de trabajo'}
                  </p>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  currentStep >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <User className="w-4 h-4" />
                  Información General
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  currentStep >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Settings className="w-4 h-4" />
                  Actividades
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  currentStep >= 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  Guardar
                </div>
              </div>
            </div>            <form onSubmit={handleSubmitJornada} className="space-y-4">
              {/* Información de la jornada */}
              <Card className="p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Información de la Jornada</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Operario</label>
                    <Input 
                      type="text" 
                      value={nombreOperario || "Cargando..."} 
                      disabled 
                      className="bg-gray-50 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
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
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                    />
                  </div>
                </div>
              </Card>{/* Resumen de actividades existentes */}
              {!urlJornadaId && actividadesResumen.length > 0 && (
                <Card className="p-3 bg-yellow-50 border-l-4 border-l-yellow-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <h3 className="text-sm font-semibold text-gray-800">
                        Actividades Existentes ({actividadesResumen.length})
                      </h3>
                    </div>
                    <span className="text-xs text-gray-500">
                      {parseLocalDate(jornadaData.fecha)?.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  
                  {/* Lista compacta horizontal */}
                  <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                    {actividadesResumen.map(act => (
                      <div key={act._id} className="bg-white px-3 py-1.5 rounded-md border shadow-sm flex-shrink-0 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-blue-700 truncate max-w-20">
                            {act.procesosNombres}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 font-mono">
                            {act.otiNumero}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 font-mono text-xs">
                            {act.horaInicio ? new Date(act.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                            -
                            {act.horaFin ? new Date(act.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumen rápido */}
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <p className="text-xs text-gray-600">
                      💡 <strong>{actividadesResumen.length} actividades</strong> registradas para esta fecha
                    </p>
                  </div>
                </Card>
              )}              {/* Actividades */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      {urlJornadaId ? "Actividades de la Jornada" : "Nuevas Actividades"}
                    </h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={addActividad}
                    variant="outline"
                    className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 h-8 px-3 text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar Actividad
                  </Button>
                </div>                {actividades.map((actividad, index) => (
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
                ))}                {/* Botón adicional para agregar actividad al final de la lista */}
                {actividades.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      onClick={addActividad}
                      variant="outline"
                      className="flex items-center gap-2 hover:bg-blue-100 hover:border-blue-300 border-dashed border-2 h-12 px-6 text-sm bg-blue-50/30 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar otra actividad
                    </Button>
                  </div>
                )}
              </div>{/* Botones de acción */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-4 border-t-blue-500">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      onClick={handleSubmitActividad}
                      variant="outline"
                      disabled={loading || actividades.length === 0}
                      className="flex items-center gap-2 hover:bg-blue-50 h-9 px-4 text-sm"
                    >
                      <Save className="w-3 h-3" />
                      Guardar Actividad Individual
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-base h-10"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Guardar Todas las Actividades
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </form>
          </div>
        </div>
      </div> 
    </div>
  );
}
