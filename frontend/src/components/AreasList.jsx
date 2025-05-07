import React from 'react';

const AreasList = ({ areas, onEditar, onEliminar }) => {
    if(!areas) {
        return <p>Cargando areas...</p>
    }
    return (
        <div>
            <h2>Lista de Áreas</h2>
            {areas.length === 0 ? (
                <p>No hay áreas registradas.</p>
            ) : (
                <ul>
                    {areas.map(area => (
                        <li key={area._id}>
                            {area.nombre}
                            <button onClick={() => onEditar(area)}>Editar</button>
                            <button onClick={() => onEliminar(area._id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AreasList;