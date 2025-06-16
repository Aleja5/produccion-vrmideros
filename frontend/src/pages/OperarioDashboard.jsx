import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { Sidebar } from '../components/Sidebar';
import { Button, Card, Input } from '../components/ui/index';
import EditarProduccion from './EditarProduccion';
import DetalleJornadaModal from '../components/DetalleJornadaModal';
import { ClipboardList, UserCircle2 } from 'lucide-react'; // Asumo que CheckCircleIcon no es necesario aquí o viene de otro lugar
import { motion } from 'framer-motion';

// --- NUEVAS IMPORTACIONES ---
import ActivityCard from '../components/ActivityCard';
import { getFormattedLocalDateDisplay, getFechaISOForComparison, getCurrentLocalDateDisplay } from '../utils/helpers'; // Importa de helpers

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
    console.log('OperarioDashboard se está re-renderizando...');
    // --- State Variables ---
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actualizarKey, setActualizarKey] = useState(Date.now()); // Using timestamp for force updates
    const [jornadaDetalleId, setJornadaDetalleId] = useState(null);
    const [filtro, setFiltro] = useState(''); // No se está usando en el render, considera si es necesario
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
        if (!operarioId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            console.log('🔄 Obteniendo jornadas para operario:', operarioId);

            // Uso de template literals para la URL
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

    // --- Date and Filtering Logic ---

    // Gets today's date in YYYY-MM-DD format for comparison.
    // Usando getFechaISOForComparison del helper, esto es más robusto
    const hoyISO = getFechaISOForComparison(new Date().toISOString());

    // Filter jornadas with at least one activity
    const jornadasFiltradas = jornadas.filter((jornada) =>
        jornada.registros && jornada.registros.length > 0
    );
    // Find today's jornada
    const jornadaActual = jornadasFiltradas.find(jornada => {
        const fechaJornada = getFechaISOForComparison(jornada.fecha);
        return fechaJornada === hoyISO;
    });    const calcularTotalTiempo = (jornada) => {
        if (!jornada?.totalTiempoActividades) {
            return 'N/A';
        }

        const tiempoData = jornada.totalTiempoActividades;
        
        // Usar tiempo efectivo si está disponible, sino usar el método anterior
        const tiempoMinutos = tiempoData.tiempoEfectivo !== undefined ? 
            tiempoData.tiempoEfectivo : 
            (tiempoData.horas * 60 + tiempoData.minutos);        const hours = Math.floor(tiempoMinutos / 60);
        const minutes = tiempoMinutos % 60;
        
        return `${tiempoMinutos} min (${hours}h ${minutes}m)`;
    };

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
      const handleRegistroProduccion = useCallback(() => {
        navigate('/registro-produccion');
    }, [navigate]);


    const handleVerDetalleJornada = useCallback((jornadaId) => {
        setJornadaDetalleId(jornadaId);
    }, []);

    const handleCerrarDetalleJornada = useCallback(() => {
        setJornadaDetalleId(null);
    }, []);

    const handleEditarActividad =useCallback ((actividad) => {
        setActividadAEditar(actividad);
    }, []);

    // Force update using timestamp
    const recargarJornadas = useCallback(() => {
        const nuevoTimestamp = Date.now();
        console.log('🔄 Forzando recarga de jornadas - Nuevo timestamp:', nuevoTimestamp);
        setActualizarKey(nuevoTimestamp);
        
    }, []);    const handleAgregarActividad = useCallback(() => {
        navigate('/registro-produccion');
    }, [navigate]);

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
            <div className="flex bg-gray-100 min-h-screen h-screen">
                <Sidebar className="h-full flex flex-col" />
                <div className="flex-1 p-6 overflow-auto">
                <div className="container mx-auto py-8 max-w-7xl">
                    <ToastContainer />
                    {/* Section Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">                            
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
                        <>                            {/* Sección de Jornada de Hoy Header */}
                            <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-white font-bold">Jornada de Hoy</h2>
                                    <p className="text-sm">{jornadaActual?.fecha ? getFormattedLocalDateDisplay(jornadaActual.fecha) : getCurrentLocalDateDisplay()}</p>
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
                                        {/* List of Activities for Today's Jornada */}                                        {jornadaActual.registros?.length > 0 ? (
                                            jornadaActual.registros.map((actividad) => {
                                                // Añadir el ID de la jornada a la actividad
                                                const actividadConJornada = {
                                                    ...actividad,
                                                    jornada: jornadaActual._id
                                                };
                                                return (
                                                    <ActivityCard
                                                        key={actividad._id}
                                                        actividad={actividadConJornada}
                                                        onVerDetalle={handleVerDetalleJornada}
                                                        onEditarActividad={handleEditarActividad}
                                                    />
                                                );
                                            })
                                        ) : (                                            <div className="text-center col-span-full py-8 text-gray-500">
                                                <p className="mb-4">No hay actividades registradas para hoy en esta jornada.</p>
                                                <Button
                                                    onClick={handleAgregarActividad}
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
                                    <p className="mb-6 text-xl">Parece que no tienes una jornada activa registrada para hoy.</p>
                                    <Button
                                        onClick={handleRegistroProduccion}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-lg shadow-md"
                                    >
                                        Comenzar Registro de Tiempo
                                    </Button>
                                </div>
                            )}
                        </>
                    )}                  
                        {/* Solo mostrar el botón si existe una jornada actual con actividades registradas */}
                        {jornadaActual && jornadaActual.registros && jornadaActual.registros.length > 0 && (
                            <div className="flex justify-between items-center mt-6">
                                <Button className="bg-blue-200 blue font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all duration-300 cursor-pointer" onClick={handleRegistroProduccion}>
                                    Añadir actividad a jornada actual
                                </Button>                           
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperarioDashboard;