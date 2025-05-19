import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Pencil, Trash2 } from 'lucide-react';

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
    const [jornada, setJornada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetalleJornada = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/jornadas/${jornadaId}`);
                if (response.data) {
                    console.log('Detalle jornada API:', response.data); // <-- DEBUG: Ver los datos reales
                    setJornada(response.data);
                } else {
                    setError('No se encontraron detalles para esta jornada.');
                }
            } catch (error) {
                console.error('Error al cargar el detalle de la jornada:', error);
                setError('Error al cargar los detalles.');
            } finally {
                setLoading(false);
            }
        }; fetchDetalleJornada();
    }, [jornadaId]);

    if (loading) return <div className="text-center mt-6">Cargando detalles...</div>;
    if (error) return <div className="text-center text-red-500 mt-6">Error: {error}</div>;
    if (!jornada) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Fondo oscuro */}
            <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" />

            {/* Contenedor modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 md:w-3/4 lg:w-2/3 p-6 z-10 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Detalle de la Jornada</h2>
                <p className="mb-6 text-sm text-gray-600"><strong>Fecha:</strong> {ajustarFechaLocal(jornada.fecha).toLocaleDateString()}</p>

                <h3 className="text-lg font-semibold text-gray-700 mb-4">Actividades:</h3>

                {jornada.registros && jornada.registros.length > 0 ? (
                    <div className="space-y-4">
                        {jornada.registros.map((registro, index) => (
                            <div key={registro._id} className="border rounded-lg p-4 bg-gray-50 shadow-sm relative">
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        title="Editar actividad"
                                        className="text-blue-600 hover:text-blue-800"
                                        onClick={() => onEditarActividad?.(registro)}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        title="Eliminar actividad"
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => onEliminarActividad?.(registro)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <h4 className="text-md font-semibold mb-2 text-gray-700">Actividad #{index + 1}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                                    <p><strong>OTI:</strong> {registro.oti?.numeroOti || registro.oti || 'N/A'}</p>
                                    <p><strong>Área:</strong> {registro.areaProduccion?.nombre || registro.areaProduccion || 'N/A'}</p>
                                    <p><strong>Máquina:</strong> {registro.maquina?.nombre || registro.maquina || 'N/A'}</p>
                                    <p><strong>Proceso:</strong> {registro.proceso?.nombre || registro.proceso || 'N/A'}</p>
                                    <p><strong>Insumo:</strong> {registro.insumos?.nombre || registro.insumos || 'N/A'}</p>
                                    <p><strong>Tipo de Tiempo:</strong> {registro.tipoTiempo || 'N/A'}</p>
                                    <p><strong>Hora Inicio:</strong> {getHora(registro.horaInicio)}</p>
                                    <p><strong>Hora Fin:</strong> {getHora(registro.horaFin)}</p>
                                    <p><strong>Tiempo:</strong> {registro.tiempo} min</p>
                                    <p><strong>Observaciones:</strong> {registro.observaciones || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No hay actividades registradas para esta jornada.</p>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        className="bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded transition-all"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalleJornadaModal;
