import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axiosInstance from '../utils/axiosInstance';
import { Pencil, Trash2, X, Calendar, Clock, User, Settings, Factory, Wrench, Package } from 'lucide-react';
import EditarProduccion from "../pages/EditarProduccion";

// Utilidad para extraer hora en formato HH:mm de un string ISO o Date
const getHora = (valor) => {
    if (!valor) return 'N/A';
    try {
        const date = new Date(valor);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'N/A';
    }
};

const ajustarFechaLocal = (fechaUTC) => {
    const fecha = new Date(fechaUTC);
    return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

const DetalleJornadaModal = ({ jornadaId, onClose, onEditarActividad, onEliminarActividad }) => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [jornada, setJornada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProduccion, setSelectedProduccion] = useState(null);    const fetchDetalleJornada = async () => { // Renamed for clarity and consistency
        setLoading(true);
        try {
            console.log('🔍 Cargando detalles de la jornada:', jornadaId);
            const response = await axiosInstance.get(`/jornadas/${jornadaId}`);
            if (response.data) {
                console.log('✅ Detalle jornada API:', response.data);
                setJornada(response.data);
                setError(''); // Limpiar errores previos
            } else {
                setError('No se encontraron detalles para esta jornada.');
            }
        } catch (error) {
            console.error('❌ Error al cargar el detalle de la jornada:', error);
            const mensajeError = error.response?.data?.message || 
                                 error.response?.data?.error || 
                                 'Error al cargar los detalles de la jornada';
            setError(mensajeError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetalleJornada();
    }, [jornadaId]);

    const handleOpenEditModal = (produccion) => {
        setSelectedProduccion(produccion);
        setShowEditModal(true);
        // If onEditarActividad was intended to do something else, adjust accordingly
        // For now, we assume it's primarily to trigger the modal opening here.
        if (onEditarActividad) {
            onEditarActividad(produccion); 
        }
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedProduccion(null);
    };

    const handleGuardarEditModal = async () => {
        // First, ensure the EditarProduccion modal is hidden
        setShowEditModal(false);
        setSelectedProduccion(null);

        // Then, call the onClose prop passed to DetalleJornadaModal.
        // This should hide DetalleJornadaModal itself and its backdrop.
        if (onClose) {
            onClose();
        }

        // Finally, navigate to the dashboard.
        // The fetchDetalleJornada() call is removed as we are navigating away.
        navigate('/operario-dashboard'); 
    };    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 z-10">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Cargando detalles de la jornada...</p>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 z-10 max-w-md">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Error al cargar detalles</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Fondo oscuro mejorado */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Contenedor modal rediseñado */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden z-10">
                {/* Header del modal */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Detalle de la Jornada</h2>
                                <p className="text-blue-100 flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4" />
                                    {ajustarFechaLocal(jornada.fecha).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Información de la jornada */}
                <div className="px-8 py-6 bg-gray-50 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                            <div className="bg-green-100 p-3 rounded-xl">
                                <User className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Operario</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {jornada.operario?.name || 'N/A'}
                                </p>
                            </div>
                        </div>
                          <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 font-medium">Duración Total</p>                                <p className="text-lg font-semibold text-gray-800">
                                    {jornada.totalTiempoActividades ? (
                                        jornada.totalTiempoActividades.tiempoEfectivo !== undefined 
                                            ? `${Math.floor(jornada.totalTiempoActividades.tiempoEfectivo / 60)}h ${jornada.totalTiempoActividades.tiempoEfectivo % 60}m`
                                            : `${jornada.totalTiempoActividades.horas || 0}h ${jornada.totalTiempoActividades.minutos || 0}m`
                                    ) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <Settings className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Actividades</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {jornada.registros?.length || 0} registradas
                                </p>
                            </div>
                        </div>
                    </div>                </div>                {/* Contenido scrolleable */}
                <div className="overflow-y-auto max-h-[calc(95vh-280px)] px-8 py-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Actividades Registradas
                    </h3>

                    {jornada.registros && jornada.registros.length > 0 ? (
                        <div className="space-y-6">
                            {jornada.registros.map((registro, index) => (
                                <div key={registro._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                                    {/* Botones de acción mejorados */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="Editar actividad"
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-xl transition-all"
                                            onClick={() => handleOpenEditModal(registro)}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            title="Eliminar actividad"
                                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl transition-all"
                                            onClick={() => onEliminarActividad?.(registro)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Header de la actividad */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-xl">
                                            <span className="font-bold text-lg">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-800">
                                                Actividad {index + 1}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {getHora(registro.horaInicio)} - {getHora(registro.horaFin)}
                                            </p>
                                        </div>
                                        <div className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {registro.tiempo} min
                                        </div>
                                    </div>

                                    {/* Grid de información */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Package className="w-5 h-5 text-amber-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">OTI</p>
                                                <p className="font-semibold text-gray-800">
                                                    {registro.oti?.numeroOti || registro.oti || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Factory className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Área</p>
                                                <p className="font-semibold text-gray-800">
                                                    {registro.areaProduccion?.nombre || registro.areaProduccion || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Wrench className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Máquina</p>
                                                <p className="font-semibold text-gray-800">
                                                    {registro.maquina?.nombre || registro.maquina || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Settings className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Proceso</p>
                                                <p className="font-semibold text-gray-800">
                                                    {registro.procesos && Array.isArray(registro.procesos) && registro.procesos.length > 0
                                                        ? registro.procesos.map(p => p.nombre || p).join(', ')
                                                        : registro.proceso?.nombre || registro.proceso || 'N/A'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Package className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Insumos</p>
                                                <p className="font-semibold text-gray-800">
                                                    {registro.insumos && Array.isArray(registro.insumos) && registro.insumos.length > 0
                                                        ? registro.insumos.map(i => i.nombre || i).join(', ')
                                                        : 'N/A'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Clock className="w-5 h-5 text-orange-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Tipo de Tiempo</p>
                                                <p className="font-semibold text-gray-800">
                                                    {registro.tipoTiempo || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    {registro.observaciones && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                                            <p className="text-sm text-gray-600 font-medium mb-1">Observaciones:</p>
                                            <p className="text-gray-800">{registro.observaciones}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Settings className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay actividades registradas</h3>
                            <p className="text-gray-500">Esta jornada aún no tiene actividades asociadas.</p>
                        </div>
                    )}
                </div>

                {/* Footer del modal */}
                <div className="bg-gray-50 px-8 py-4 border-t flex justify-end">
                    <button
                        className="bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                        Cerrar
                    </button>
                </div>
            </div>            {showEditModal && selectedProduccion && (
                <EditarProduccion
                    produccion={selectedProduccion}
                    onClose={handleCloseEditModal}
                    onGuardar={handleGuardarEditModal}
                    invokedAsModal={true}
                />
            )}
        </div>
    );
};

export default DetalleJornadaModal;
