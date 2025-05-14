import React, { useState, useEffect } from 'react';

const MaquinaForm = ({ maquinaInicial, onGuardar, onCancelar }) => {
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        if (maquinaInicial) {
            setNombre(maquinaInicial.nombre);
        } else {
            setNombre('');
        }
    }, [maquinaInicial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ nombre });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="nombre">Nombre:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <button type="submit">Guardar</button>
            <button type="button" onClick={onCancelar}>Cancelar</button>
        </form>
    );
};

export default MaquinaForm;