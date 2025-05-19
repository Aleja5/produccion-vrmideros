import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debugLog } from '../utils/log';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import Navbar from '../components/Navbar';
import { Input, Button, Card } from '../components/ui/index';
import EditarProduccion from './EditarProduccion'; // Importa el nuevo componente
import DetalleJornadaModal from '../components/DetalleJornadaModal'; // Importa el nuevo componente
import {CheckCircleIcon} from '@heroicons/react/24/solid';


const OperarioDashboard = () => {
    const [jornadas, setJornadas] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editandoId, setEditandoId] = useState(null);
    const jornadaAEditar = jornadas.find(jornada => jornada._id === editandoId);
    const [actualizar, setActualizar] = useState(false);
    const [jornadaDetalleId, setJornadaDetalleId] = useState(null);
    const navigate = useNavigate();

  const storedOperario = JSON.parse(localStorage.getItem('operario'));
  const operarioId = storedOperario?.id || storedOperario?._id;
  const operarioName = storedOperario?.name || 'Operario';

  const fetchJornadas = async () => {
    try {
        setLoading(true);
        const response = await axiosInstance.get(`/jornadas/operario/${operarioId}`);
        let data = response.data;

        debugLog("Datos de jornadas recibidos:", data);

        if (!Array.isArray(data)) {
            console.warn("⚠️ La API no devolvió un array de jornadas, asignando []");
            data = [];
        }

        setJornadas([...data]);
        setError(null);
    } catch (error) {
        console.error('Error al obtener las jornadas:', error);
        setError('No se pudieron cargar las jornadas.');
        setJornadas([]);
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
        if (operarioId) {
            fetchJornadas();
        }
    }, [actualizar, operarioId]);

    // Filtrar solo jornadas con al menos una actividad
    const jornadasFiltradas = jornadas.filter((jornada) =>
        (jornada.registros && jornada.registros.length > 0) &&
        new Date(jornada.fecha).toLocaleDateString().includes(filtro)
    );


    const ajustarFechaLocal = (fechaUTC) => {
        const fecha = new Date(fechaUTC);
        return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
    };

    const jornadaActual = jornadasFiltradas.find(jornada => {
        const fechaJornada = ajustarFechaLocal(jornada.fecha).toDateString();
        const fechaHoy = ajustarFechaLocal(new Date()).toDateString();
        return fechaJornada === fechaHoy;
    });

    const jornadasAnteriores = jornadasFiltradas.filter(jornada => {
        const fechaJornada = ajustarFechaLocal(jornada.fecha).toDateString();
        const fechaHoy = ajustarFechaLocal(new Date()).toDateString();
        return fechaJornada !== fechaHoy;
    });

    // Calcula la diferencia en minutos entre dos horas (horaInicio y horaFin de la jornada)
    const calcularTiempoTotalJornada = (jornada) => {
        if (!jornada.horaInicio || !jornada.horaFin) return 0;
        let inicio, fin;
        // Si es string tipo '08:00', convertir a fecha base
        if (/^\d{2}:\d{2}$/.test(jornada.horaInicio) && /^\d{2}:\d{2}$/.test(jornada.horaFin)) {
            inicio = new Date(`1970-01-01T${jornada.horaInicio}:00`);
            fin = new Date(`1970-01-01T${jornada.horaFin}:00`);
        } else {
            // Si es string tipo fecha completa
            inicio = new Date(jornada.horaInicio);
            fin = new Date(jornada.horaFin);
        }
        if (isNaN(inicio) || isNaN(fin) || fin <= inicio) return 0;
        return Math.floor((fin - inicio) / 60000);
    };

    // Suma los tiempos de las actividades, asegurando que sean números válidos
    const calcularTotalTiempo = (jornada) => {
        return jornada.registros && Array.isArray(jornada.registros)
            ? jornada.registros.reduce((total, registro) => {
                const t = Number(registro.tiempo);
                return total + (isNaN(t) ? 0 : t);
            }, 0)
            : 0;
    };

    const handleRegistroProduccion = () => {
        navigate('/registro-produccion');
    };

    const handleVerDetalleJornada = (jornadaId) => {
        setJornadaDetalleId(jornadaId);
    };

    const handleCerrarDetalleJornada = () => {
        setJornadaDetalleId(null);
    };

    const iniciarEdicion = (jornada) => {
        debugLog("Iniciando edición para la jornada:", jornada._id);
        setEditandoId(jornada._id);
    };

    const cerrarModalEditar = () => {
        setEditandoId(null);
    };

    const recargarJornadas = () => {
        setActualizar((prev) => !prev);
    };

    const handleEliminarJornada = (id) => {
        confirmAlert({
            title: '¿Estás seguro?',
            message: '¿Quieres eliminar esta jornada y todas sus actividades?',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            await axiosInstance.delete(`/jornadas/eliminar/${id}`);
                            setActualizar((prev) => !prev);
                            toast.success("Jornada eliminada con éxito");
                        } catch (error) {
                            console.error('Error al eliminar la jornada:', error);
                            toast.error('No se pudo eliminar la jornada.');
                        }
                    }
                },
                {
                    label: 'Cancelar',
                    onClick: () => { }
                }
            ]
        });
    };

    const handleAgregarActividad = (jornadaId) => {
        navigate(`/registro-produccion/${jornadaId}`); // Redirige al formulario de registro de producción
    };

    const handleGuardarJornadaCompleta = async (jornadaId) => {
        try {
            await axiosInstance.post(`/jornadas/completa`, { jornadaId });
            toast.success(`Jornada ${jornadaId} guardada como completa`);
            setActualizar((prev) => !prev);
        } catch (error) {
            console.error('Error al guardar la jornada como completa:', error);
            toast.error('No se pudo guardar la jornada como completa.');
        }
    };

    const handleEliminarJornadaActual = async (jornadaId) => {
        try {
            await axiosInstance.delete(`/jornadas/eliminar/${jornadaId}`);
            toast.success('Jornada eliminada con éxito');
            setActualizar((prev) => !prev);
        } catch (error) {
            console.error('Error al eliminar la jornada:', error);
            toast.error('No se pudo eliminar la jornada.');
        }
    };

    // Handlers para editar y eliminar actividad desde el modal de detalle
    const [actividadAEditar, setActividadAEditar] = useState(null);

    const handleEditarActividad = (actividad) => {
        setActividadAEditar(actividad);
    };

    const handleEliminarActividad = (actividad) => {
        confirmAlert({
            title: '¿Eliminar actividad?',
            message: '¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer.',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            await axiosInstance.delete(`/produccion/eliminar/${actividad._id}`);
                            toast.success('Actividad eliminada con éxito');
                            setActualizar((prev) => !prev);
                        } catch (error) {
                            toast.error('No se pudo eliminar la actividad.');
                        }
                    }
                },
                { label: 'Cancelar', onClick: () => {} }
            ]
        });
    };

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

    return (
        <>
            <Navbar />
            <ToastContainer />

            {editandoId !== null && (
                <EditarProduccion
                    produccion={jornadaAEditar?.registros?.length > 0 ? jornadaAEditar.registros[0] : {}} // Pasar una producción para editar
                    onClose={cerrarModalEditar}
                    onGuardar={recargarJornadas}
                />
            )}

            {jornadaDetalleId !== null && (
                <DetalleJornadaModal
                    jornadaId={jornadaDetalleId}
                    onClose={handleCerrarDetalleJornada}
                    onEditarActividad={handleEditarActividad}
                    onEliminarActividad={handleEliminarActividad}
                />
            )}

            {actividadAEditar && (
                <EditarProduccion
                    produccion={actividadAEditar}
                    onClose={() => setActividadAEditar(null)}
                    onGuardar={() => {
                        setActividadAEditar(null);
                        setActualizar((prev) => !prev);
                    }}
                />
            )}

            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Producción VR Mideros</h1>
                    <h3 className="font-semibold">{operarioName}</h3>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <Button className="bg-blue-200 blue font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all duration-300 cursor-pointer" onClick={handleRegistroProduccion}>Registrar Nueva Producción</Button>
                    <Button className="bg-red-200 text-gray-800 hover:bg-red-500 hover:text-red-100 px-6 py-3 rounded-xl shadow transition-all duration-300 cursor-pointer" variant="ghost" onClick={() => navigate('/validate-cedula')}>
                        Salir
                    </Button>
                </div>

                <div className="mt-6 mb-4 max-w-sm">
                    <Input
                        placeholder="Buscar por fecha..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>

                {/* Jornada Actual Card */}
                {jornadaActual && (
                    <Card className="mb-6">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span>{ajustarFechaLocal(jornadaActual.fecha).toLocaleDateString()}</span>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    En progreso {/* O el estado real de tu jornada */}
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
                                    {/* Izquierda: Proceso y OTI */}
                                    <div className="flex flex-col">
                                        <h4 className="font-semibold text-gray-700">{actividad.proceso?.nombre}</h4>
                                        <p className="text-gray-600 text-sm">OTI: {actividad.oti?.numeroOti}</p>
                                    </div>

                                    {/* Derecha: Horario */}
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
                )}

                {/* Jornadas Anteriores Cards */}
                {jornadasAnteriores.length > 0 && (
                    <h2 className="text-xl font-semibold mb-3">Jornadas Anteriores</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jornadasAnteriores.map((jornada) => (
                        <Card key={jornada._id} className="relative group">
                        {/* Contenido clickeable para ver el detalle */}
                        <div className="p-4 cursor-pointer" onClick={() => handleVerDetalleJornada(jornada._id)}>
                            <h3 className="font-semibold mb-1">Fecha: {ajustarFechaLocal(jornada.fecha).toLocaleDateString()}</h3>
                            <p className="text-gray-600 mb-1">Actividades: {jornada.registros ? jornada.registros.length : 0}</p>
                            <p className="text-gray-600 mb-2">Tiempo Total Actividades: {calcularTotalTiempo(jornada)} min</p>
                            <p className="text-gray-600 mb-2">Tiempo Total Jornada: {calcularTiempoTotalJornada(jornada)} min</p>
                            {jornada.estado === 'completa' && (
                                <div className="flex items-center text-green-500">
                                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                                    <span>Registrado</span>
                                </div>
                            )}
                        </div>
                        </Card>
                    ))}
                    </div>


                {loading && <p className="mt-4">Cargando jornadas...</p>}
                {error && <p className="mt-4 text-red-500">{error}</p>}
                {jornadasFiltradas.length === 0 && !loading && !error && <p className="mt-4">No se encontraron jornadas.</p>}
            </div>
        </>
    );
};

export default OperarioDashboard;