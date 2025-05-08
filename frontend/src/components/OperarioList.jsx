import React from 'react';

const OperarioList = ({ operarios, onEditar, onEliminar }) => {
  return (
    <div>
      <h2>Lista de Operarios</h2>
      {operarios.length === 0 ? (
        <p>No hay operarios registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {operarios.map(operario => (
              <tr key={operario._id}>
                <td>{operario.name}</td>
                <td>{operario.cedula}</td>
                <td>
                  <button onClick={() => onEditar(operario)}>Editar</button>
                  <button onClick={() => onEliminar(operario._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OperarioList;