import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'; // Importar react-select para multiselección

const ProcesoForm = ({ procesoInicial, onGuardar, onCancelar }) => {
    const [nombre, setNombre] = useState('');
    const [areasSeleccionadas, setAreasSeleccionadas] = useState([]); // Cambiar a array para múltiples áreas
    const [areasProduccion, setAreasProduccion] = useState([]); 

    // Cargar áreas de producción al montar el componente
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/areas');
                if (response.data && Array.isArray(response.data.areas)) {
                    setAreasProduccion(response.data.areas);
                } else {
                    setAreasProduccion(response.data || []);
                }
            } catch (error) {
                console.error("Error al cargar áreas de producción:", error);
            }
        };
        fetchAreas();
    }, []);

    useEffect(() => {
        if (procesoInicial) {
            setNombre(procesoInicial.nombre || '');
            
            // Manejar el campo areas que ahora es un array
            let areasIniciales = [];
            if (procesoInicial.areas && Array.isArray(procesoInicial.areas)) {
                areasIniciales = procesoInicial.areas.map(area => 
                    typeof area === 'object' ? area._id : area
                );
            } else if (procesoInicial.areaId) {
                // Compatibilidad con el formato anterior
                areasIniciales = [typeof procesoInicial.areaId === 'object' ? procesoInicial.areaId._id : procesoInicial.areaId];
            }
            setAreasSeleccionadas(areasIniciales);
        } else {
            setNombre('');
            setAreasSeleccionadas([]);
        }
    }, [procesoInicial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ nombre, areas: areasSeleccionadas }); // Enviar array de áreas
    }

    // Opciones para react-select
    const opcionesAreas = areasProduccion.map(area => ({
        value: area._id,
        label: area.nombre
    }));

    // Valores seleccionados para react-select
    const valoresSeleccionados = areasSeleccionadas.map(areaId => {
        const area = areasProduccion.find(a => a._id === areaId);
        return area ? { value: area._id, label: area.nombre } : null;
    }).filter(Boolean);

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
                <label htmlFor="areas" className="block text-sm font-medium text-gray-700 mb-1">Áreas de Producción:</label>
                <Select
                    inputId="areas"
                    isMulti
                    name="areas"
                    options={opcionesAreas}
                    value={valoresSeleccionados}
                    onChange={(selectedOptions) => {
                        const nuevasAreas = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                        setAreasSeleccionadas(nuevasAreas);
                    }}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Seleccione las áreas donde aplica este proceso"
                    styles={{
                        control: (provided, state) => ({
                            ...provided,
                            borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
                            boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
                            '&:hover': {
                                borderColor: '#6366f1',
                            },
                        }),
                    }}
                />
                <p className="mt-1 text-sm text-gray-500">
                    Selecciona una o varias áreas donde se puede usar este proceso
                </p>
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
