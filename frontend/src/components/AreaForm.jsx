import React, { useState, useEffect } from 'react';

const AreaForm = ({ areaInicial, onGuardar, onCancelar }) => {
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        if (areaInicial) {
            setNombre(areaInicial.nombre || '');
        } else {
            setNombre('');
        }
    }, [areaInicial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ nombre });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Área:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="appearance-none block w-full rounded-lg border border-gray-300 shadow-sm py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    placeholder="Ingrese el nombre del área de producción"
                />
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

export default AreaForm;