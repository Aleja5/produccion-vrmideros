// src/pages/OperarioDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { Sidebar } from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Button, Card, Input } from '../components/ui/index';
import EditarProduccion from './EditarProduccion';
import DetalleJornadaModal from '../components/DetalleJornadaModal';
import { ClipboardList, Hammer, Eye, Pencil, UserCircle2, CheckCircleIcon} from 'lucide-react';
import { motion } from 'framer-motion';

// --- NUEVAS IMPORTACIONES ---
import ActivityCard from '../components/ActivityCard';
import { getFormattedLocalDateDisplay, getFechaISOForComparison } from '../utils/helpers'; // Importa de helpers

// ---
// Loading Skeleton Component
const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse p-4 bg-white rounded-lg shadow-md">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div> {/* Jornada de Hoy title */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => ( // Simulate 3 activity cards
                <Card key={i} className="p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="h-1.5 bg-gray-200 rounded-full mb-4">
                        <div className="h-1.5 bg-gray-300 rounded-full w-1/2"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div> {/* Icon */}
                        <div className="flex-1 space-y-1">
                            <div className="h-5 bg-gray-300 rounded w-3/4"></div> {/* Process name */}
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div> {/* OTI */}
                        </div>
                        <div className="h-6 bg-gray-300 rounded-full w-1/5"></div> {/* State tag */}
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div> {/* Inicio label */}
                        <div className="h-4 bg-gray-300 rounded w-2/3"></div> {/* Inicio time */}
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div> {/* Fin label */}
                        <div className="h-4 bg-gray-300 rounded w-2/3"></div> {/* Fin time */}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div> {/* Duration */}
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div> {/* View icon */}
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div> {/* Edit icon */}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
        <div className="h-10 bg-gray-200 rounded w-full mt-6"></div> {/* Resumen del Día */}
    </div>
);

// ---
// OperarioDashboard Functional Component
const OperarioDashboard = () => {
    console.log(' OperarioDashboard se esta re-renderizando...');
    // --- State Variables ---
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actualizarKey, setActualizarKey] = useState(Date.now()); // Using timestamp for force updates
    const [jornadaDetalleId, setJornadaDetalleId] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [actividadAEditar, setActividadAEditar] = useState(null); // Define this state as well

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
        if (!operarioId) {
            setLoading(false);
            return;
        }
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
        const INACTIVITY_TIME = 180000; // 3 minutos

        const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                toast.warning("Tiempo de inactividad alcanzado. Redirigiendo a validación de cédula.");
                navigate("/validate-cedula");
            }, INACTIVITY_TIME);
        };

        const handleActivity = () => resetTimeout();

        // Event listeners para detectar actividad del usuario
        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("click", handleActivity);
        window.addEventListener("scroll", handleActivity);

        resetTimeout();

        // Función de limpieza para los event listeners y el temporizador
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("click", handleActivity);
            window.removeEventListener("scroll", handleActivity);
        };
    }, [navigate]);

    // --- Date and Filtering Logic (Corrected Placement) ---

    // Gets today's date in YYYY-MM-DD format for comparison.
    const hoyISO = (() => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();

    // Filter jornadas with at least one activity
    const jornadasFiltradas = jornadas.filter((jornada) =>
        jornada.registros && jornada.registros.length > 0
    );

    // Find today's jornada (ensure this is the ONLY declaration)
    const jornadaActual = jornadasFiltradas.find(jornada => {
        const fechaJornada = getFechaISOForComparison(jornada.fecha);
        return fechaJornada === hoyISO;
    });

    // Define jornadasAnteriores by filtering out today's jornada and applying the filter state
    const jornadasAnteriores = jornadasFiltradas.filter(jornada => {
        const fechaJornada = getFechaISOForComparison(jornada.fecha);
        return fechaJornada !== hoyISO && fechaJornada.includes(filtro);
    });

    // Calculate total time by summing activity times for 'Resumen del Día'
    const calcularTotalTiempo = (jornada) => {
        const totalMinutes = jornada.registros && Array.isArray(jornada.registros)
            ? jornada.registros.reduce((total, registro) => {
                  const t = Number(registro.tiempo);
                  return total + (isNaN(t) ? 0 : t);
              }, 0)
            : 0;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${totalMinutes} min (${hours} horas ${minutes} min)`;
    };

    // Calculate total time between jornada start and end times for 'Jornadas Anteriores Cards'
    const calcularTiempoTotalJornada = (jornada) => {
        if (!jornada.horaInicio || !jornada.horaFin) {
            return 'N/A'; // Or handle as appropriate
        }
        const inicio = new Date(jornada.horaInicio);
        const fin = new Date(jornada.horaFin);
        const diffMs = fin - inicio; // Difference in milliseconds
        const diffMinutes = Math.floor(diffMs / (1000 * 60)); // Difference in minutes

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${diffMinutes} min (${hours} horas ${minutes} min)`;
    };

    // --- Event Handlers (optimized with useCallback) ---

    const handleRegistroProduccion = useCallback(() => {
        // If there's an active jornada today, navigate to add activity to it.
        // Otherwise, navigate to general registration to create a new jornada.
        if (jornadaActual && jornadaActual._id) {
            navigate(`/registro-produccion/${jornadaActual._id}`);
        } else {
            navigate('/registro-produccion');
        }
    }, [navigate, jornadaActual]);


    const handleVerDetalleJornada = useCallback((jornadaId) => {
        setJornadaDetalleId(jornadaId);
    }, []);

    const handleCerrarDetalleJornada = useCallback(() => {
        setJornadaDetalleId(null);
    }, []);

    // Removed iniciarEdicion and cerrarModalEditar as they seem to relate to 'editandoId' which is not declared.
    // Use handleEditarActividad and setActividadAEditar for activity editing.
    // const iniciarEdicion = (jornada) => {
    //     debugLog("Iniciando edición para la jornada:", jornada._id);
    //     setEditandoId(jornada._id);
    // };

    // const cerrarModalEditar = () => {
    //     setEditandoId(null);
    // };

    const handleEliminarJornada = (id) => {
        confirmAlert({
            title: 'Confirmación de eliminación de jornada',
            message: '¿Estás seguro de que deseas eliminar esta jornada y todas sus actividades asociadas? Esta acción no se puede deshacer.',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            await axiosInstance.delete(`/jornadas/${id}`);
                            setActualizarKey(Date.now()); // Use setActualizarKey
                            toast.success('Jornada eliminada con éxito');
                        } catch (error) {
                            console.error('Error al eliminar la jornada:', error);
                            toast.error('No se pudo eliminar la jornada.');
                        }
                    }
                },
                {
                    label: 'Cancelar',
                    onClick: () => {
                        toast.info('Eliminación cancelada');
                    }
                }
            ]
        });
    };

    const handleGuardarJornadaCompleta = async (jornadaId) => {
        confirmAlert({
            title: 'Confirmación',
            message: '¿Está seguro de dar la jornada por completada?',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            await axiosInstance.put(`/jornadas/${jornadaId}`, { estado: "completa" });
                            toast.success(`Jornada ${jornadaId} guardada como completa`);
                            setActualizarKey(Date.now()); // Use setActualizarKey
                        } catch (error) {
                            console.error('Error al guardar la jornada como completa:', error);
                            toast.error('No se pudo guardar la jornada como completa.');
                        }
                    }
                },
                {
                    label: 'No',
                    onClick: () => console.log('Acción cancelada')
                }
            ]
        });
    };

    const handleEliminarJornadaActual = async (jornadaId) => {
        confirmAlert({
            title: '¿Estás seguro?',
            message: '¿Quieres eliminar la jornada actual y todas sus actividades?',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            await axiosInstance.delete(`/jornadas/${jornadaId}`);
                            toast.success('Jornada eliminada con éxito');
                            setActualizarKey(Date.now()); // Use setActualizarKey
                        } catch (error) {
                            console.error('Error al eliminar la jornada:', error);
                            toast.error('No se pudo eliminar la jornada.');
                        }
                    }
                },
                {
                    label: 'Cancelar',
                    onClick: () => {
                        toast.info('Eliminación cancelada');
                    }
                }
            ]
        });
    };

    // Handlers para editar y eliminar actividad desde el modal de detalle

    const handleEditarActividad =useCallback ((actividad) => {
        setActividadAEditar(actividad);
    }, []);

    // Force update using timestamp
    const recargarJornadas = useCallback(() => {
        const nuevoTimestamp = Date.now();
        console.log('🔄 Forzando recarga de jornadas - Nuevo timestamp:', nuevoTimestamp);
        setActualizarKey(nuevoTimestamp);
    }, []);

    const handleAgregarActividad = useCallback((jornadaId) => {
        navigate(`/registro-produccion/${jornadaId}`);
    }, [navigate]);

    const handleEliminarActividad = useCallback((actividad) => {
        confirmAlert({
            title: 'Confirmación de eliminación de actividad',
            message: '¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.',
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
                {
                    label: 'Cancelar',
                    onClick: () => {
                        toast.info('Eliminación cancelada');
                    }
                }
            ]
        });
    }, [recargarJornadas]);

    // Function to force update after registration
    const forzarActualizacionDespuesDeRegistro = useCallback(() => {
        console.log('🎯 Forzando actualización después de registro...');
        setTimeout(() => {
            const nuevoTimestamp = Date.now();
            console.log('🔄 Actualizando con timestamp:', nuevoTimestamp);
            setActualizarKey(nuevoTimestamp);
        }, 500); // Reduced from 1000ms for quicker feedback
    }, []);

    // Detect when returning from registro-produccion
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
                    {/* Section Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                            <ClipboardList className="w-7 h-7 text-blue-600" aria-label="Producción" />
                            Producción VR Mideros
                        </div>
                        <div className="flex flex-col items-center space-y-1 bg-white px-4 py-2 rounded-lg shadow-sm">
                            <UserCircle2 className="h-8 w-8 text-gray-500" />
                            <span className="text-sm text-gray-500">Operario</span>
                            <span className="font-semibold text-gray-700">{operarioName}</span>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSkeleton />
                    ) : (
                        <>
                            {/* Sección de Jornada de Hoy Header */}
                            <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-white font-bold">Jornada de Hoy</h2>
                                    <p className="text-sm">{getFormattedLocalDateDisplay(jornadaActual?.fecha || new Date().toISOString())}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-bold">{jornadaActual?.registros?.length || 0}</span>
                                    <p className="text-sm">Actividades</p>
                                </div>
                            </div>

                            {/* Main content for today's jornada */}
                            {jornadaActual ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="mb-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* List of Activities for Today's Jornada */}
                                        {jornadaActual.registros?.length > 0 ? (
                                            jornadaActual.registros.map((actividad) => {
                                                return (
                                                    <ActivityCard
                                                        key={actividad._id}
                                                        actividad={actividad}
                                                        onVerDetalle={handleVerDetalleJornada}
                                                        onEditarActividad={handleEditarActividad}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="text-center col-span-full py-8 text-gray-500">
                                                <p className="mb-4">No hay actividades registradas para hoy en esta jornada.</p>
                                                <Button
                                                    onClick={() => handleAgregarActividad(jornadaActual._id)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                                >
                                                    Agregar Primera Actividad a esta Jornada
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resumen del Día */}
                                    <Card className="p-6 rounded-xl shadow-lg mt-6 bg-blue-50 border border-blue-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3 text-blue-800">
                                            <ClipboardList className="w-6 h-6" aria-label="Resumen del Día" />
                                            <h3 className="text-lg font-semibold">Resumen del Día</h3>
                                            <p className="text-sm text-blue-700">Tiempo total trabajado</p>
                                        </div>
                                        <div className="text-right text-blue-900">
                                            <span className="text-2xl font-bold">{calcularTotalTiempo(jornadaActual)}</span>
                                        </div>
                                    </Card>
                                </motion.div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="mb-6 text-xl">No hay jornada registrada para hoy.</p>
                                    <Button
                                        onClick={handleRegistroProduccion}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-lg shadow-md"
                                    >
                                        Crear Jornada Hoy
                                    </Button>
                                </div>
                            )}
                        </>
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
                            onGuardar={() => {
                                setActividadAEditar(null);
                                setActualizarKey(Date.now()); // Use setActualizarKey
                            }}
                        />
                    )}

                    {/* The duplicate section below was causing the error. I'm removing it.
                        The content for jornadaActual has been moved above within the main content block.
                        The button and filter input related to ALL jornadas (not just today) are kept below.
                    */}

                    <div className="container mx-auto px-4 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">Producción VR Mideros</h1>
                           
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            {/* Changed this button to use the new handleRegistroProduccion logic */}
                            <Button className="bg-blue-200 blue font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all duration-300 cursor-pointer" onClick={handleRegistroProduccion}>
                                {jornadaActual ? 'Añadir actividad a jornada actual' : 'Registrar Nueva Producción'}
                            </Button>
                           
                        </div>

                        <div className="mt-6 mb-4 max-w-sm">
                            <Input
                                placeholder="Buscar por fecha (YYYY-MM-DD)"
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                            />
                        </div>

                        {/* Jornada Actual Card - Moved/Integrated into the main loading conditional block above */}
                        {/* {jornadaActual && (
                            <Card className="mb-6">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            <span>{ajustarFechaLocal(jornadaActual.fecha).toLocaleDateString()}</span>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {jornadaActual.estado === 'completa' ? (
                                                <>
                                                    <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500 inline" /> Registrado
                                                </>
                                            ) : (
                                                'En progreso'
                                            )}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-semibold mb-2">Jornada Actual</h2>
                                   <div className="mb-4 flex justify-between items-center">

                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span className="text-s">{jornadaActual.registros ? jornadaActual.registros.length : 0} actividades registradas</span>
                                        </div>
                                        {jornadaActual.registros && jornadaActual.registros.length > 0 && (
                                            <span className="text-s">
                                            Tiempo total: <span className="font-semibold">{calcularTotalTiempo(jornadaActual)} min</span>
                                            </span>
                                        )}
                                        </div>

                                        {jornadaActual.registros && jornadaActual.registros
                                            .sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio)) // Orden por horaInicio ascendente
                                            .map((actividad) => (
                                            <div key={actividad._id} className="bg-gray-50 rounded-md p-3 mb-2 border border-gray-200">
                                                <div className="flex justify-between items-center text-gray-700 text-sm">
                                                <div className="flex flex-col">
                                                    <h4 className="font-semibold text-gray-700">{actividad.proceso?.nombre}</h4>
                                                    <p className="text-gray-600 text-sm">OTI: {actividad.oti?.numeroOti}</p>
                                                </div>

                                                <span className="text-gray-600 font-medium whitespace-nowrap">
                                                    {actividad.horaInicio && !isNaN(new Date(actividad.horaInicio))
                                                    ? new Date(actividad.horaInicio).toLocaleTimeString('en-GB', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        })
                                                    : 'Sin inicio'}{' '}
                                                    -
                                                    {actividad.horaFin && !isNaN(new Date(actividad.horaFin))
                                                    ? new Date(actividad.horaFin).toLocaleTimeString('en-GB', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        })
                                                    : 'Sin fin'}
                                                </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-6 flex items-center space-x-4">
                                            <Button onClick={handleRegistroProduccion}>Añadir actividad</Button>
                                            <Button primary onClick={() => handleGuardarJornadaCompleta(jornadaActual._id)}>Guardar jornada completa</Button>
                                            <Button variant="destructive" onClick={() => handleEliminarJornadaActual(jornadaActual._id)}>Eliminar jornada</Button>
                                        </div>
                                    </div>
                                </Card>
                        )} */}

                        {/* Jornadas Anteriores Cards */}
                        {jornadasAnteriores.length > 0 && (
                            <h2 className="text-xl font-semibold mb-3">Jornadas Anteriores</h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jornadasAnteriores.map((jornada) => (
                                <Card key={jornada._id} className="relative group">
                                {/* Contenido clickeable para ver el detalle */}
                                <div className="p-4 cursor-pointer" onClick={() => handleVerDetalleJornada(jornada._id)}>
                                    <h3 className="font-semibold mb-1">Fecha: {getFormattedLocalDateDisplay(jornada.fecha)}</h3>
                                    <p className="text-gray-600 mb-1">Actividades: {jornada.registros ? jornada.registros.length : 0}</p>
                                    {/* Ensure calcularTiempoTotalJornada is defined and correctly used */}
                                    <p className="text-gray-600 mb-2">Tiempo Total Jornada: {calcularTiempoTotalJornada(jornada)}</p>
                                </div>

                                {/* Action Buttons for previous jornadas - hidden until hover */}
                                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleVerDetalleJornada(jornada._id)}
                                        title="Ver Detalles"
                                        className="p-1"
                                    >
                                        <Eye className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                                    </Button>
                                    {jornada.estado !== 'completa' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleGuardarJornadaCompleta(jornada._id)}
                                            title="Marcar como Completa"
                                            className="p-1"
                                        >
                                            <CheckCircleIcon className="w-5 h-5 text-gray-600 hover:text-green-500" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleEliminarJornada(jornada._id)}
                                        title="Eliminar Jornada"
                                        className="p-1"
                                    >
                                        <Hammer className="w-5 h-5 text-gray-600 hover:text-red-500" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OperarioDashboard;