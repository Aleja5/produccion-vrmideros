import React from 'react';

const ProcesoList = ({ procesos, onEditar, onEliminar }) => {
    if (!procesos) {
        return <p>Cargando procesos...</p>;
    }

    return (
        <div>
            <h2>Lista de Procesos</h2>
            {procesos.length === 0 ? (
                <p>No hay procesos registrados.</p>
            ) : (
                <ul>
                    {procesos.map(proceso => (
                        <li key={proceso._id}>
                            {proceso.nombre}
                            <button onClick={() => onEditar(proceso)}>Editar</button>
                            <button onClick={() => onEliminar(proceso._id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProcesoList;

