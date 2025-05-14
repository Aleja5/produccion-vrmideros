import React, { useState, useEffect } from 'react';

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
    <div>
      <h2>{operarioInicial ? 'Editar Operario' : 'Crear Nuevo Operario'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Nombre:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="cedula">Cédula:</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </form>
    </div>
  );
};

export default OperarioForm;