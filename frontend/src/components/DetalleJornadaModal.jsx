import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const DetalleJornadaModal = ({ jornadaId, onClose }) => {
    const [jornada, setJornada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetalleJornada = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/jornadas/${jornadaId}`);
                if (response.data) {
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
        };

        fetchDetalleJornada();
    }, [jornadaId]);

    if (loading) {
        return <div>Cargando detalles...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!jornada) {
        return null; // No mostrar nada si no hay jornada cargada
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-lg w-4/5 md:w-3/4 lg:w-2/3 p-6">
                <h2 className="text-xl font-bold mb-4">Detalle de la Jornada</h2>
                <p className="mb-2"><strong>Fecha:</strong> {new Date(jornada.fecha).toLocaleDateString()}</p>
                <p className="mb-4"><strong>Observaciones:</strong> {jornada.observacionesJornada || 'N/A'}</p>

                <h3 className="text-lg font-semibold mb-2">Actividades:</h3>
                {jornada.actividades && jornada.actividades.length > 0 ? (
                    <ul>
                        {jornada.actividades.map((actividad, index) => (
                            <li key={actividad._id} className="mb-2 border-b pb-2">
                                <strong>Actividad #{index + 1}</strong>
                                <p><strong>OTI:</strong> {actividad.oti?.numeroOti || 'N/A'}</p>
                                <p><strong>Área:</strong> {actividad.areaProduccion?.nombre || 'N/A'}</p>
                                <p><strong>Máquina:</strong> {actividad.maquina?.nombre || 'N/A'}</p>
                                <p><strong>Proceso:</strong> {actividad.proceso?.nombre || 'N/A'}</p>
                                <p><strong>Insumo:</strong> {actividad.insumos?.nombre || 'N/A'}</p>
                                <p><strong>Tiempo Preparación:</strong> {actividad.tiempoPreparacion} min</p>
                                <p><strong>Tiempo Operación:</strong> {actividad.tiempoOperacion} min</p>
                                <p><strong>Observaciones Actividad:</strong> {actividad.observacionesActividad || 'N/A'}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No hay actividades registradas para esta jornada.</p>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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