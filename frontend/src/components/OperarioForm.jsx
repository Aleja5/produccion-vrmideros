import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react'; // Importar el icono Save

const OperarioForm = ({ operarioInicial, onGuardar, onCancelar }) => {
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');

  useEffect(() => {
    if (operarioInicial) {
      setName(operarioInicial.name);
      setCedula(operarioInicial.cedula);
    } else {
      setName('');
      setCedula('');
    }
  }, [operarioInicial]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onGuardar({ name, cedula });
  };

  return (
    <form onSubmit={handleSubmit}>
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Operario:</label>
            <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Ingrese el nombre del operario"
            />
        </div>
        <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">Cédula del Operario:</label>
            <input
                type="text"
                id="cedula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Ingrese la cédula del operario"
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
                <Save size={18} className="mr-2" />
                Guardar
            </button>                
        </div>
    </form>
  );
};

export default OperarioForm;