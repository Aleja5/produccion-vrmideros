import React from 'react';
import { Pencil, Trash2 } from 'lucide-react'; // Import icons
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const AreasList = ({ areas, onEditar, onEliminar }) => {
    // Función para manejar el clic en eliminar con confirmación elegante
    const handleDeleteClick = (areaId, areaNombre) => {
        confirmAlert({
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de que quieres eliminar el área "${areaNombre}"? Esta acción es irreversible.`,
            buttons: [
                {
                    label: 'Sí, eliminar',
                    onClick: () => {
                        onEliminar(areaId);
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

    if (!areas) {
        return <p className="text-center text-gray-500 py-8">Cargando áreas...</p>;
    }

    if (areas.length === 0) {
        return (
            <div className="text-center py-10">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9-1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-700">No se encontraron áreas</h3>
                <p className="mt-1 text-sm text-gray-500">Parece que aún no hay áreas registradas.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto"> 
            <table className="min-w-full table-auto border-separate border-spacing-y-2">
                <thead className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wider">
                    <tr>
                        <th className="px-6 py-3 text-left">Nombre del area</th>
                        <th className="px-6 py-3 text-center">Acciones</th>                      
                        
                    </tr>
                </thead>
                <tbody className="text-gray-700">
                    {areas.map(area => (
                        <tr key={area._id} className="bg-white hover:shadow rounded-lg">
                            <td className="px-6 py-1 rounded-l-lg">{area.nombre}</td>
                            <td className="px-6 py-1 text-center rounded-r-lg">
                                <div className="flex justify-center space-x-2"> 
                                    <button
                                        onClick={() => onEditar(area)}
                                        className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                                        title="Editar"
                                    >
                                        <Pencil size={16}/>
                                        
                                    </button>                                    <button
                                        onClick={() => handleDeleteClick(area._id, area.nombre)}
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

export default AreasList;