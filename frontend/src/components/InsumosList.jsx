import React from 'react';

const InsumosList = ({ insumos, onEditar, onEliminar }) => {
    if (!insumos) {
        return <p>Cargando insumos...</p>
    }
    return (
        <div>
            <h2>Lista de Insumos</h2>
            {insumos.length === 0 ? (
                <p>No hay insumos registrados.</p>
            ) : (
                <ul>
                    {insumos.map(insumo => (
                        <li key={insumo._id}>
                            {insumo.nombre}
                            <button onClick={() => onEditar(insumo)}>Editar</button>
                            <button onClick={() => onEliminar(insumo._id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default InsumosList;