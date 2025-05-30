import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Importar axios

const ProcesoForm = ({ procesoInicial, onGuardar, onCancelar }) => {
    const [nombre, setNombre] = useState('');
    const [areaId, setAreaId] = useState(''); 
    const [areasProduccion, setAreasProduccion] = useState([]); 

    // Cargar áreas de producción al montar el componente
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/areas'); // Ajusta la URL si es necesario
                if (response.data && Array.isArray(response.data.areas)) {
                    setAreasProduccion(response.data.areas);
                } else {
                    // Si la respuesta no es un array o no tiene la propiedad areas, intenta con response.data directamente
                    // Esto es en caso de que tu API de áreas devuelva directamente el array.
                    setAreasProduccion(response.data || []);
                }
            } catch (error) {
                console.error("Error al cargar áreas de producción:", error);
                // Considera mostrar un toast o mensaje al usuario
            }
        };
        fetchAreas();
    }, []);

    useEffect(() => {
        if (procesoInicial) {
            setNombre(procesoInicial.nombre || '');
            setAreaId(procesoInicial.areaId?._id || procesoInicial.areaId || ''); // Manejar si areaId es un objeto o solo el ID
        } else {
            setNombre('');
            setAreaId('');
        }
    }, [procesoInicial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ nombre, areaId }); // Incluir areaId al guardar
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proceso:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder="Ingrese el nombre del proceso"
                />
            </div>

            <div>
                <label htmlFor="areaProduccion" className="block text-sm font-medium text-gray-700">Área de Producción:</label>
                <select
                    id="areaProduccion"
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                >
                    <option value="">Seleccione un Área</option>
                    {areasProduccion.map(area => (
                        <option key={area._id} value={area._id}>
                            {area.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end items-center gap-4 pt-2">
                <button
                    type="button"
                    onClick={onCancelar}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-5 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center"
                >
                    Guardar
                </button>
            </div>
        </form>
    );
};

export default ProcesoForm;
