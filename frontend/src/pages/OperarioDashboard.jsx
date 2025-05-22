import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debugLog } from '../utils/log';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import Navbar from '../components/Navbar';
import { Input, Button, Card } from '../components/ui/index';
import EditarProduccion from './EditarProduccion';
import DetalleJornadaModal from '../components/DetalleJornadaModal';
import { Sidebar } from '../components/Sidebar';
import { ClipboardList, Hammer } from 'lucide-react';
import { motion } from 'framer-motion';

// ---
// Constants for activity states (for UI display)
const estados = [
    { label: 'Completado', className: 'bg-green-100 text-green-700' },
    { label: 'En pausa', className: 'bg-yellow-100 text-yellow-700' },
    { label: 'Pendiente', className: 'bg-gray-100 text-gray-600' },
];

// ---
// OperarioDashboard Functional Component
const OperarioDashboard = () => {
    // --- State Variables ---
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editandoId, setEditandoId] = useState(null);
    const jornadaAEditar = jornadas.find(j => j._id === editandoId);
    // CAMBIO: Usar timestamp para forzar actualizaciones
    const [actualizarKey, setActualizarKey] = useState(Date.now());
    const [jornadaDetalleId, setJornadaDetalleId] = useState(null);
    const [actividadAEditar, setActividadAEditar] = useState(null);

    const navigate = useNavigate();

    // Obtener datos del operario desde localStorage
    const storedOperario = (() => {
        try {
            return JSON.parse(localStorage.getItem('operario'));
        } catch (e) {
            console.error("Error parsing operario from localStorage:", e);
            return null;
        }
    })();
    const operarioId = storedOperario?.id || storedOperario?._id;
    const operarioName = storedOperario?.name || 'Operario';

    // --- Effects ---

    // Redirige si no hay operario en localStorage
    useEffect(() => {
        if (!operarioId) {
            toast.error('Sesión expirada. Inicie sesión nuevamente.');
            navigate('/validate-cedula');
        }
    }, [operarioId, navigate]);

    // Función memoizada para obtener jornadas con mejor manejo de errores
    const fetchJornadas = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Obteniendo jornadas para operario:', operarioId);
            
            const res = await axiosInstance.get(`/jornadas/operario/${operarioId}`);
            
            console.log('✅ Respuesta del servidor (jornadas):', res.data);
            console.log('📊 Número de jornadas obtenidas:', Array.isArray(res.data) ? res.data.length : 0);
            
            setJornadas(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('❌ Error completo al obtener jornadas:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            const mensajeError = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Error al obtener jornadas del servidor';
            toast.error(mensajeError);
        } finally {
            setLoading(false);
        }
    }, [operarioId]);

    // Carga las jornadas cuando el componente se monta o 'actualizarKey' cambia
    useEffect(() => {
        if (operarioId) {
            console.log('🔄 useEffect disparado - actualizarKey:', actualizarKey);
            fetchJornadas();
        }
    }, [actualizarKey, operarioId, fetchJornadas]);

    // Manejo de inactividad para redirigir
    useEffect(() => {
        let timeoutId;

        const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                toast.warning("Tiempo de inactividad alcanzado. Redirigiendo a validación de cédula.");
                navigate("/validate-cedula");
            }, 180000); // 3 minutos de inactividad (180000 ms)
        };

        const handleActivity = () => resetTimeout();

        // Event listeners para detectar actividad del usuario
        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("click", handleActivity);

        resetTimeout();

        // Función de limpieza para los event listeners y el temporizador
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("click", handleActivity);
        };
    }, [navigate]);

    // --- Helper Functions ---

    // Ajusta una fecha UTC a un objeto Date local
    const ajustarFechaLocal = (fechaUTC) => new Date(fechaUTC);

    // CORRECCIÓN: Función más robusta para obtener fecha local sin problemas de zona horaria
    const getFechaISO = (fecha) => {
        const fechaUTC = new Date(fecha);
        // Usar getUTCFullYear, getUTCMonth, getUTCDate para evitar problemas de zona horaria
        const year = fechaUTC.getUTCFullYear();
        const month = String(fechaUTC.getUTCMonth() + 1).padStart(2, '0');
        const day = String(fechaUTC.getUTCDate()).padStart(2, '0'); // CORRECCIÓN: fechaUTC.getUTCDate() en lugar de fechaUTCDate()
        
        console.log('🗓️ getFechaISO Debug:', {
            fechaOriginal: fecha,
            fechaUTC: fechaUTC.toISOString(),
            year, month, day,
            resultado: `${year}-${month}-${day}`
        });
        
        return `${year}-${month}-${day}`;
    };

    const hoyISO = (() => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();

    // Filtra jornadas con al menos una actividad
    const jornadasFiltradas = jornadas.filter((jornada) =>
        jornada.registros && jornada.registros.length > 0
    );

    // Encuentra la jornada del día actual
    const jornadaActual = jornadasFiltradas.find(jornada => {
        const fechaJornada = getFechaISO(jornada.fecha);
        console.log('🗓️ Comparando fechas - Jornada:', fechaJornada, 'Hoy:', hoyISO);
        return fechaJornada === hoyISO;
    });

    // Debug: Mostrar información de jornadas
    console.log('📋 Información de jornadas:', {
        totalJornadas: jornadas.length,
        jornadasFiltradas: jornadasFiltradas.length,
        jornadaActual: jornadaActual ? 'Encontrada' : 'No encontrada',
        fechaHoy: hoyISO
    });

    // Calcula el tiempo total sumando los tiempos de las actividades
    const calcularTotalTiempo = (jornada) => {
        return jornada.registros && Array.isArray(jornada.registros)
            ? jornada.registros.reduce((total, registro) => {
                const t = Number(registro.tiempo);
                return total + (isNaN(t) ? 0 : t);
            }, 0)
            : 0;
    };

    // --- Event Handlers (optimizados con useCallback) ---

    const handleRegistroProduccion = useCallback(() => {
        navigate('/registro-produccion');
    }, [navigate]);

    const handleVerDetalleJornada = useCallback((jornadaId) => {
        setJornadaDetalleId(jornadaId);
    }, []);

    const handleCerrarDetalleJornada = useCallback(() => {
        setJornadaDetalleId(null);
    }, []);

    const iniciarEdicion = useCallback((jornada) => {
        debugLog("Iniciando edición para la jornada:", jornada._id);
        setEditandoId(jornada._id);
    }, []);

    const cerrarModalEditar = useCallback(() => {
        setEditandoId(null);
    }, []);

    // CAMBIO: Usar timestamp para forzar actualización
    const recargarJornadas = useCallback(() => {
        const nuevoTimestamp = Date.now();
        console.log('🔄 Forzando recarga de jornadas - Nuevo timestamp:', nuevoTimestamp);
        setActualizarKey(nuevoTimestamp);
    }, []);

    const handleEliminarJornada = useCallback((id) => {
        confirmAlert({
            title: '¿Estás seguro?',
            message: '¿Quieres eliminar esta jornada y todas sus actividades?',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            console.log('🗑️ Eliminando jornada:', id);
                            await axiosInstance.delete(`/jornadas/eliminar/${id}`);
                            recargarJornadas();
                            toast.success("Jornada eliminada con éxito");
                        } catch (error) {
                            console.error('❌ Error al eliminar jornada:', {
                                message: error.message,
                                response: error.response?.data,
                                status: error.response?.status
                            });
                            
                            const mensajeError = error.response?.data?.message || 
                                               error.response?.data?.error || 
                                               'No se pudo eliminar la jornada';
                            toast.error(mensajeError);
                        }
                    }
                },
                {
                    label: 'Cancelar',
                    onClick: () => { }
                }
            ]
        });
    }, [recargarJornadas]);

    const handleAgregarActividad = useCallback((jornadaId) => {
        navigate(`/registro-produccion/${jornadaId}`);
    }, [navigate]);

    const handleGuardarJornadaCompleta = useCallback(async (jornadaId) => {
        try {
            console.log('💾 Guardando jornada como completa:', jornadaId);
            await axiosInstance.post(`/jornadas/completa`, { jornadaId });
            toast.success(`Jornada ${jornadaId} guardada como completa`);
            recargarJornadas();
        } catch (error) {
            console.error('❌ Error al guardar jornada como completa:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            const mensajeError = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'No se pudo guardar la jornada como completa';
            toast.error(mensajeError);
        }
    }, [recargarJornadas]);

    const handleEliminarJornadaActual = useCallback(async (jornadaId) => {
        try {
            console.log('🗑️ Eliminando jornada actual:', jornadaId);
            await axiosInstance.delete(`/jornadas/eliminar/${jornadaId}`);
            toast.success('Jornada eliminada con éxito');
            recargarJornadas();
        } catch (error) {
            console.error('❌ Error al eliminar jornada actual:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            const mensajeError = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'No se pudo eliminar la jornada';
            toast.error(mensajeError);
        }
    }, [recargarJornadas]);

    // Handlers para editar y eliminar actividad desde el modal de detalle
    const handleEditarActividad = useCallback((actividad) => {
        setActividadAEditar(actividad);
    }, []);

    const handleEliminarActividad = useCallback((actividad) => {
        confirmAlert({
            title: '¿Eliminar actividad?',
            message: '¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer.',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            console.log('🗑️ Eliminando actividad:', actividad._id);
                            await axiosInstance.delete(`/produccion/eliminar/${actividad._id}`);
                            toast.success('Actividad eliminada con éxito');
                            recargarJornadas();
                        } catch (error) {
                            console.error('❌ Error al eliminar actividad:', {
                                message: error.message,
                                response: error.response?.data,
                                status: error.response?.status
                            });
                            
                            const mensajeError = error.response?.data?.message || 
                                               error.response?.data?.error || 
                                               'No se pudo eliminar la actividad';
                            toast.error(mensajeError);
                        }
                    }
                },
                { label: 'Cancelar', onClick: () => { } }
            ]
        });
    }, [recargarJornadas]);

    // --- Debug useEffect para monitorear cambios ---
    useEffect(() => {
        console.log('🔍 Debug Dashboard - Estado actual:', {
            jornadas: jornadas.length,
            loading,
            jornadaActual: jornadaActual ? 'Sí' : 'No',
            actualizarKey,
            operarioId
        });
        
        if (jornadas.length > 0) {
            console.log('📋 Detalle de jornadas:', jornadas.map(j => ({
                id: j._id,
                fecha: j.fecha,
                fechaISO: getFechaISO(j.fecha),
                registros: j.registros?.length || 0
            })));
        }
    }, [jornadas, loading, jornadaActual, actualizarKey, operarioId]);

    // Función para forzar actualización después de crear registro
    const forzarActualizacionDespuesDeRegistro = useCallback(() => {
        console.log('🎯 Forzando actualización después de registro...');
        setTimeout(() => {
            const nuevoTimestamp = Date.now();
            console.log('🔄 Actualizando con timestamp:', nuevoTimestamp);
            setActualizarKey(nuevoTimestamp);
        }, 1000); // Espera 1 segundo para que el servidor procese
    }, []);

    // Detectar cuando se regresa de registro-produccion
    useEffect(() => {
        const handleFocus = () => {
            console.log('👁️ Ventana enfocada - verificando si hay nuevos registros...');
            forzarActualizacionDespuesDeRegistro();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [forzarActualizacionDespuesDeRegistro]);

    // --- Render JSX ---
    return (
        <>
            <Navbar />
            <div className="flex bg-gray-100 min-h-screen h-screen">
                <Sidebar className="h-full flex flex-col" />
                <div className="flex-1 p-6 overflow-auto">
                    <ToastContainer />
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <span className="text-gray-500 text-lg">Cargando...</span>
                        </div>
                    ) : (
                        <>
                            {/* Sección de Encabezado */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 text-2xl font-bold">
                                    <ClipboardList className="w-6 h-6 text-blue-600" aria-label="Producción" />
                                    Producción VR Mideros
                                </div>
                                <h3 className="font-semibold">Bienvenido, {operarioName}</h3>
                            </div>

                            {/* Debug Info - Solo en desarrollo */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                    <strong>🔍 Debug Info:</strong><br/>
                                    📊 Jornadas totales: {jornadas.length} | 
                                    🗓️ Jornada actual: {jornadaActual ? 'Sí' : 'No'} | 
                                    📅 Fecha hoy: {hoyISO} | 
                                    🔄 ActualizarKey: {actualizarKey}<br/>
                                    {jornadas.length > 0 && (
                                        <div className="mt-2">
                                            <strong>📋 Jornadas disponibles:</strong><br/>
                                            {jornadas.map(j => (
                                                <div key={j._id} className="ml-2">
                                                    • {getFechaISO(j.fecha)} - {j.registros?.length || 0} registros
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!jornadaActual && jornadas.length > 0 && (
                                        <div className="mt-2 text-red-600">
                                            ⚠️ No hay jornada para hoy ({hoyISO}). 
                                            Última jornada: {jornadas[0] ? getFechaISO(jornadas[0].fecha) : 'N/A'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sección de Botones de Acción */}
                            <div className="flex justify-end items-center mb-4">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        onClick={handleRegistroProduccion}
                                        aria-label="Registrar Nueva Actividad"
                                        className="bg-blue-400 hover:bg-blue-700 text-white font-semibold"
                                    >
                                        Registrar Nueva Actividad
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate('/validate-cedula')}
                                        aria-label="Salir"
                                        className="bg-red-400 hover:bg-red-700 text-white font-semibold ml-2"
                                    >
                                        Salir
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Sección de Jornada de Hoy */}
                            {jornadaActual ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="mb-6"
                                >
                                    <Card className="p-6 rounded-xl shadow-lg">
                                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5 text-gray-500" aria-label="Jornada de hoy" />
                                            Jornada de hoy - {new Date(jornadaActual.fecha).toLocaleDateString('es-CO')}
                                        </h2>

                                        {/* Lista de Actividades de la Jornada de Hoy */}
                                        {jornadaActual.registros?.map((actividad, index) => {
                                            const estado = estados[index % estados.length];
                                            return (
                                                <motion.div
                                                    key={actividad._id}
                                                    className="bg-white p-3 rounded-lg mb-3 border border-gray-200 flex justify-between items-center shadow-sm"
                                                    whileHover={{ scale: 1.01 }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Hammer className="w-5 h-5 text-blue-500" aria-label="Actividad" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{actividad.proceso?.nombre || 'N/A'}</h4>
                                                            <p className="text-sm text-gray-500">OTI: {actividad.oti?.numeroOti || 'N/A'}</p>
                                                        </div>
                                                        <span className={`ml-4 px-2 py-1 rounded-full text-xs ${estado.className}`}>
                                                            {estado.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {actividad.horaInicio ? ajustarFechaLocal(actividad.horaInicio).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' }) : '--:--'} -
                                                        {actividad.horaFin ? ajustarFechaLocal(actividad.horaFin).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        <div className="text-right mt-4 text-gray-700 font-medium">
                                            Tiempo total de hoy: {calcularTotalTiempo(jornadaActual)} min
                                        </div>
                                    </Card>
                                </motion.div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No hay jornada registrada para hoy.</p>
                                    <Button
                                        onClick={handleRegistroProduccion}
                                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        Crear Jornada Hoy
                                    </Button>
                                </div>
                            )}

                            {/* Modals */}
                            {jornadaDetalleId && (
                                <DetalleJornadaModal
                                    jornadaId={jornadaDetalleId}
                                    onClose={handleCerrarDetalleJornada}
                                    onEditActivity={handleEditarActividad}
                                    onDeleteActivity={handleEliminarActividad}
                                    onUpdate={recargarJornadas}
                                />
                            )}

                            {actividadAEditar && (
                                <EditarProduccion
                                    actividad={actividadAEditar}
                                    onClose={() => setActividadAEditar(null)}
                                    onUpdate={recargarJornadas}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default OperarioDashboard;