import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const OperarioList = ({ operarios, onEditar, onEliminar }) => {
    // Función para manejar el clic en eliminar con confirmación elegante
    const handleDeleteClick = (operarioId, operarioNombre) => {
        confirmAlert({
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de que quieres eliminar al operario "${operarioNombre}"? Esta acción es irreversible.`,
            buttons: [
                {
                    label: 'Sí, eliminar',
                    onClick: () => {
                        onEliminar(operarioId);
                    },
                    className: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg'
                },
                {
                    label: 'Cancelar',
                    onClick: () => toast.info('Eliminación cancelada.'),
                    className: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg'
                }
            ],
            closeOnEscape: true,
            closeOnClickOutside: true,
            overlayClassName: "custom-overlay-confirm-alert"
        });
    };

    if (!operarios) {
        return <p className="text-center text-gray-500 py-8">Cargando operarios...</p>;
    }

    if (operarios.length === 0) {
        return (
            <div className="text-center py-10">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.63-.63 1-1.49 1-2.4C13 7.01 11.99 6 10.5 6S8 7.01 8 8.6c0 .91.37 1.77 1 2.4M16 14H8v-1.5c0-1.66 2.69-2.5 4-2.5s4 .84 4 2.5V14zm4-4h-2v6h2V10zm-2-7a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V3z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-700">No se encontraron operarios</h3>
                <p className="mt-1 text-sm text-gray-500">Parece que aún no hay operarios registrados.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-separate border-spacing-y-2">
                <thead className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wider">
                    <tr>
                        <th className="px-6 py-3 text-left">Nombre</th>
                        <th className="px-6 py-3 text-left">Cédula</th>
                        <th className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700">
                    {operarios.map(operario => (
                        <tr key={operario._id} className="bg-white hover:shadow rounded-lg">
                            <td className="px-6 py-1 rounded-l-lg">
                                {operario.name}
                            </td>
                            <td className="px-6 py-1 rounded-l-lg">
                                {operario.cedula}
                            </td>
                            <td className="px-6 py-1 text-center rounded-r-lg">
                                <div className="flex justify-center space-x-2">
                                    <button
                                        onClick={() => onEditar(operario)}
                                        className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>                                    <button
                                        onClick={() => handleDeleteClick(operario._id, operario.name)}
                                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OperarioList;