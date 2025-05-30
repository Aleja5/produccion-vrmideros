import { Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const InsumoForm = ({ insumoInicial, onGuardar, onCancelar }) => {
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        if (insumoInicial) {
            setNombre(insumoInicial.nombre);
        } else {
            setNombre('');
        }
    }, [insumoInicial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ nombre });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Insumo:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Ingrese el nombre del insumo"
                />
            </div>
                <div className="flex justify-end items-center gap-4 pt-2">
                    <button 
                        type="button" 
                        onClick={onCancelar}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-5 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out"
                        >Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center"
                        >
                            <Save size={18} className="mr-2" />
                            Guardar
                    </button>                
                </div>
            </form>
        );
    };

export default InsumoForm;

