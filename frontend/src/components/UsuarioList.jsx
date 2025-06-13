// components/UsuarioList.jsx

import React from 'react';
// ICONOS
import { Pencil, Trash2, Users } from 'lucide-react'; // Asegúrate de tener 'lucide-react' instalado

// Asegúrate de que las rutas de importación de tus componentes de UI sean correctas
// Por ejemplo, si tus componentes de UI están en 'src/components/ui', estas rutas estarían bien:
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'react-toastify'; // Para las notificaciones de éxito/error
import { confirmAlert } from 'react-confirm-alert'; // Para la ventana de confirmación de eliminación
import 'react-confirm-alert/src/react-confirm-alert.css'; // Estilos para react-confirm-alert


// Componente Skeleton para la tabla (muestra un efecto de carga)
const UserListSkeleton = () => (
    <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-y-3 animate-pulse">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wider">
                <tr>
                    <th className="px-6 py-3 text-left">Nombre</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Rol</th>
                    <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody className="text-gray-700">
                {[...Array(5)].map((_, i) => ( // Renderiza 5 filas de esqueleto
                    <tr key={i} className="bg-white rounded-lg shadow-sm">
                        <td className="px-6 py-4 rounded-l-lg">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </td>
                        <td className="px-6 py-4 text-center rounded-r-lg">
                            <div className="flex justify-center space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


// Componente principal de la lista de usuarios
const UsuarioList = ({ usuarios, onEditar, onEliminar, isLoading, error }) => {
    // Si está cargando, muestra el esqueleto
    if (isLoading) {
        return <UserListSkeleton />;
    }

    // Si hay un error, muestra un mensaje de error
    if (error) {
        return (
            <Card className="text-center py-12 px-6 bg-red-50 shadow-lg rounded-xl flex flex-col items-center">
                <p className="text-red-600 text-lg font-semibold mb-4">Error al cargar usuarios:</p>
                <p className="text-red-500">{error}</p>
            </Card>
        );
    }

    // Si no hay usuarios y no hay errores, muestra un mensaje de "no encontrados"
    if (!usuarios || usuarios.length === 0) {
        return (
            <Card className="text-center py-12 px-6 bg-white shadow-lg rounded-xl flex flex-col items-center">
                <Users className="mx-auto h-20 w-20 text-blue-400 mb-6" />
                <h3 className="mt-2 text-2xl font-bold text-gray-800">No se encontraron usuarios</h3>
                <p className="mt-2 text-md text-gray-600">Parece que aún no hay usuarios registrados en el sistema o no coinciden con tu búsqueda.</p>
            </Card>
        );
    }

    // Función para manejar el clic en eliminar (muestra un cuadro de confirmación)
    const handleDeleteClick = (usuarioId, usuarioNombre) => {
        confirmAlert({
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de que quieres eliminar a "${usuarioNombre}"? Esta acción es irreversible.`,
            buttons: [
                {
                    label: 'Sí, eliminar',
                    onClick: () => {
                        onEliminar(usuarioId); // Llama a la prop onEliminar que viene del padre (UsuariosPage)
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
            overlayClassName: "custom-overlay-confirm-alert" // Clase para personalizar el overlay si lo necesitas
        });
    };

    return (
        <Card className="overflow-hidden shadow-lg rounded-xl bg-white p-4 md:p-6">
            {/* Título para accesibilidad (puede ser oculto si el padre ya tiene uno) */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 sr-only">Listado de Usuarios</h2>

            <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-separate border-spacing-y-3">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wider">
                        <tr>
                            <th className="px-6 py-3 text-left font-semibold rounded-l-lg">Nombre</th>
                            <th className="px-6 py-3 text-left font-semibold">Email</th>
                            <th className="px-6 py-3 text-left font-semibold">Rol</th>
                            <th className="px-6 py-3 text-center font-semibold rounded-r-lg">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {usuarios.map(usuario => (
                            <tr
                                key={usuario._id}
                                className="bg-white hover:bg-blue-50 transition-colors duration-200 ease-in-out shadow-md rounded-xl"
                            >
                                <td className="px-6 py-4 rounded-l-xl text-left whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{usuario.nombre}</div>
                                </td>
                                <td className="px-6 py-4 text-left whitespace-nowrap">
                                    <div className="text-sm text-gray-600">{usuario.email}</div>
                                </td>
                                <td className="px-6 py-4 text-left whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        usuario.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {/* Capitaliza la primera letra del rol */}
                                        {usuario.role ? usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1) : 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center rounded-r-xl">
                                    <div className="flex justify-center space-x-3">
                                        {/* Botón de Editar */}
                                        <Button
                                            size="icon"
                                            onClick={() => onEditar(usuario)} // Llama a la prop onEditar
                                            className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200"
                                            title="Editar Usuario"
                                            aria-label={`Editar usuario ${usuario.nombre}`}
                                        >
                                            <Pencil size={18} />
                                        </Button>
                                        {/* Botón de Eliminar */}
                                        <Button
                                            size="icon"
                                            onClick={() => handleDeleteClick(usuario._id, usuario.nombre)}
                                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                                            title="Eliminar Usuario"
                                            aria-label={`Eliminar usuario ${usuario.nombre}`}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default UsuarioList;