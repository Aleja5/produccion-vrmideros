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
                <label htmlFor="nombre">Nombre:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Guardar</button>
            <button type="button" onClick={onCancelar}>Cancelar</button>
        </form>
    );
};

export default InsumoForm;
    
