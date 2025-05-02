import React from 'react';

const MaquinasList = ({ maquinas, onEditar, onEliminar }) => {
    if (!maquinas) {
        return <p>Cargando maquinas...</p>
    }
    return (
        <div>
            <h2>Lista de Máquinas</h2>
            {maquinas.length === 0 ? (
                <p>No hay máquinas registradas.</p>
            ) : (
                <ul>
                    {maquinas.map(maquina => (
                        <li key={maquina._id}>
                            {maquina.nombre}
                            <button onClick={() => onEditar(maquina)}>Editar</button>
                            <button onClick={() => onEliminar(maquina._id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MaquinasList;