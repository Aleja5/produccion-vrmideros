import React from 'react';

const UsuarioList = ({ usuarios, onEditar, onEliminar }) => {
    if (!usuarios) {
        console.log(usuarios);
        return <p>Cargando usuarios...</p>
    }
    return (
        <div>
            <h2>Lista de Usuarios</h2>
            {usuarios.length === 0 ? (
                <p>No hay usuarios registrados.</p>
            ) : (
                <ul>
                    {usuarios.map(usuario => (
                        <li key={usuario._id}>
                            {usuario.nombre || usuario.email || 'Sin nombre'}
                            <button onClick={() => onEditar(usuario)}>Editar</button>
                            <button onClick={() => onEliminar(usuario._id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UsuarioList;
