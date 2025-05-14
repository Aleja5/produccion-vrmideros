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

    const jornadasFiltradas = jornadas.filter((jornada) =>
        new Date(jornada.fecha).toLocaleDateString().includes(filtro)
    );

    const jornadaActual = jornadasFiltradas.find(jornada => new Date(jornada.fecha).toDateString() === new Date().toDateString());
    const jornadasAnteriores = jornadasFiltradas.filter(jornada => new Date(jornada.fecha).toDateString() !== new Date().toDateString());

    const calcularTotalTiempo = (jornada) => {
        return jornada.registros ? jornada.registros.reduce((total, registro) => {
            return total + (registro.tiempoPreparacion || 0) + (registro.tiempoOperacion || 0);
        }, 0) : 0;
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
                    <Card className="mb-6 cursor-pointer" onClick={() => handleVerDetalleJornada(jornadaActual._id)}>
                        <div className="p-4">
                            <h2 className="text-xl font-semibold mb-2">Jornada Actual</h2>
                            <p className="text-gray-600 mb-1">
                                <span className="font-semibold">Fecha:</span> {new Date(jornadaActual.fecha).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600 mb-1">
                                <span className="font-semibold">Actividades Registradas:</span> {jornadaActual.registros ? jornadaActual.registros.length : 0}
                            </p>
                            <p className="text-gray-600 mb-2">
                                <span className="font-semibold">Tiempo Total:</span> {calcularTotalTiempo(jornadaActual)} min
                            </p>
                            <div className="flex space-x-2 mt-4">
                                <Button onClick={(e) => { e.stopPropagation(); handleAgregarActividad(jornadaActual._id); }}>Añadir actividad</Button>
                                <Button onClick={(e) => { e.stopPropagation(); handleGuardarJornadaCompleta(jornadaActual._id); }} variant="secondary">Guardar jornada completa</Button>
                                <Button onClick={(e) => { e.stopPropagation(); handleEliminarJornadaActual(jornadaActual._id); }} variant="destructive">Eliminar jornada</Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Jornadas Anteriores Cards */}
                {jornadasAnteriores.length > 0 && (
                    <h2 className="text-lg font-semibold mb-3">Jornadas Anteriores</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jornadasAnteriores.map((jornada) => (
                        <Card key={jornada._id} className="cursor-pointer" onClick={() => handleVerDetalleJornada(jornada._id)}>
                            <div className="p-4">
                                <h3 className="font-semibold mb-1">Fecha: {new Date(jornada.fecha).toLocaleDateString()}</h3>
                                <p className="text-gray-600 mb-1">Actividades: {jornada.registros ? jornada.registros.length : 0}</p>
                                <p className="text-gray-600 mb-2">Tiempo Total: {calcularTotalTiempo(jornada)} min</p>
                                {/* Condicional para mostrar el icono de registrado */}
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