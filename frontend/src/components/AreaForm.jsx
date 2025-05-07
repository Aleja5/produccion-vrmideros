import React, { useState, useEffect } from 'react';

const AreaForm = ({ areaInicial, onGuardar, onCancelar }) => {
    const [nombre, setnombre] = useState('');

    useEffect(() => {
        if (areaInicial) {
            setnombre(areaInicial.nombre);
        } else {
            setnombre('');
        }
    }, [areaInicial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ nombre });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="nombre">Nombre:</label>
                <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setnombre(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Guardar</button>
            <button type="button" onClick={onCancelar}>Cancelar</button>
        </form>
    );
};

export default AreaForm;