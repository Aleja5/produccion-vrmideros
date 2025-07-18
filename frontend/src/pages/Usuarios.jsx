import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import UsuarioList from '../components/UsuarioList';
import UsuarioForm from '../components/UsuarioForm';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { toast } from 'react-toastify';

// Componente de paginación simple
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    return (
        <div className="flex items-center justify-center space-x-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
                Anterior
            </button>

            {getPageNumbers().map(pageNumber => (
                <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                >
                    {pageNumber}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
                Siguiente
            </button>
        </div>
    );
};

const UsuariosPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 5 }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [usuarioAEditar, setUsuarioAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savingUser, setSavingUser] = useState(false); // Estado para operaciones de guardar
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de usuarios
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);
    const [showFormSuccess, setShowFormSuccess] = useState(false);
    const [savedUserData, setSavedUserData] = useState(null);const cargarUsuarios = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/usuarios?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setUsuarios(response.data.usuarios);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);        } catch (error) {
            console.error('Error al cargar los usuarios:', error);
            toast.error('Error al cargar los usuarios. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        cargarUsuarios(currentPage, searchText);
    }, [currentPage, cargarUsuarios, searchText]);

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleCrear = () => {
        setModo('crear');    
    };    const handleEditar = (usuario) => {
        console.log('Usuario a editar:', usuario); // Debug log
        setModo('editar');
        setUsuarioAEditar(usuario);
    };const handleGuardar = async (usuario) => {
        setSavingUser(true);
        try {
            let res;
            if (usuarioAEditar) {
                // Actualizar usuario
                res = await axiosInstance.put(`/usuarios/${usuarioAEditar._id}`, usuario);
                toast.success('Usuario actualizado exitosamente');
            } else {
                // Crear nuevo usuario
                res = await axiosInstance.post('/usuarios', usuario);
                toast.success('Usuario creado exitosamente');
            }

            setSavedUserData(res.data.user); // Almacenar los datos del usuario guardado
            setShowFormSuccess(true); // Mostrar el mensaje de éxito en el formulario

            // Cambiar el modo a 'success' para que UsuarioForm muestre el mensaje
            setModo('success'); 

            // Después de 3 segundos, redirigir a la lista de usuarios
            setTimeout(() => {
                cargarUsuarios(currentPage, searchText); // Recargar la lista de usuarios
                setModo('listar'); // Volver a la vista de lista
                setUsuarioAEditar(null); // Limpiar usuario a editar
                setShowFormSuccess(false); // Ocultar el mensaje de éxito
                setSavedUserData(null); // Limpiar los datos guardados
            }, 3000); // 3 segundos
            
            return res.data;
        } catch (error) {
            console.error('Error al guardar el usuario:', error);
            const message = error.response?.data?.message || 'Error al guardar el usuario';
            toast.error(message);
        } finally {
            setSavingUser(false);
        }
    };const handleEliminar = async (id) => {
        try {
            await axiosInstance.delete(`/usuarios/${id}`);
            toast.success('Usuario eliminado exitosamente');
            cargarUsuarios(currentPage, searchText); // Recargar usuarios después de eliminar
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
            const message = error.response?.data?.message || 'Error al eliminar el usuario';
            toast.error(message);
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setUsuarioAEditar(null);
    };    return (
        <>       
            <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 h-screen">
                <SidebarAdmin />

                <div className="flex-1 overflow-auto">
                    <div className="container mx-auto px-4 py-6">
                        {/* Header Card Mejorado */}
                        <div className="bg-gradient-to-r from-white to-gray-50 shadow-2xl rounded-3xl p-6 md:p-8 border border-gray-100 mb-6">
                            <div className="flex items-center gap-4 mb-6">                            
                                <div>
                                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Gestión de Usuarios</h1>
                                    <p className="text-gray-600 mt-2 text-lg">Administra y controla las cuentas de usuario del sistema</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <button
                                    onClick={handleCrear}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full md:w-auto order-first md:order-none flex items-center justify-center group"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Crear Nuevo Usuario
                                </button>

                                {modo === 'listar' && (
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                        <label htmlFor="searchText" className="sr-only"> 
                                            Buscar por Nombre:
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="searchText"
                                                value={searchText}
                                                onChange={handleSearchTextChange}
                                                placeholder="Buscar usuarios..."
                                                className="appearance-none block w-full sm:w-80 pl-12 pr-4 py-3 text-gray-700 leading-tight border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white shadow-md"
                                            />
                                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100">                            {loading ? (
                                <div className="flex justify-center items-center py-16">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
                                        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-gray-600 absolute top-0 left-0"></div>
                                    </div>
                                    <span className="ml-4 text-lg text-gray-600 font-medium">Cargando usuarios...</span>
                                </div>
                            ) : (
                                <>                                    {modo === 'listar' && (
                                        <div className="space-y-6">
                                            {/* Estadísticas rápidas */}
                                            {!searchText && (
                                                <div className="bg-gradient-to-r from-white-50 to-gray-100 rounded-2xl p-6 border border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-100 p-3 rounded-xl">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-800">Total de Usuarios</h3>
                                                                <p className="text-gray-600">Cuentas de usuario registradas</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-3xl font-bold text-blue-600">{totalResults}</span>
                                                            <p className="text-sm text-gray-500">activos</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {usuarios.length > 0 ? (
                                                <UsuarioList usuarios={usuarios} onEditar={handleEditar} onEliminar={handleEliminar} />
                                            ) : (
                                                <div className="text-center py-12">
                                                    <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                        {searchText ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                                                    </h3>
                                                    <p className="text-gray-500 mb-6">
                                                        {searchText 
                                                            ? `No se encontraron usuarios que coincidan con "${searchText}"`
                                                            : 'Comienza creando el primer usuario del sistema'
                                                        }
                                                    </p>
                                                    {!searchText && (
                                                        <button
                                                            onClick={handleCrear}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                                        >
                                                            Crear primer usuario
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}{usuarios.length > 0 && modo === 'listar' && searchText && (
                                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm font-medium text-green-800">
                                                    {usuarios.length} resultado{usuarios.length !== 1 ? 's' : ''} encontrado{usuarios.length !== 1 ? 's' : ''} para "{searchText}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {totalResults > 0 && modo === 'listar' && !searchText && totalPages > 1 && (
                                        <div className="mt-8 flex justify-center">
                                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalResults={totalResults}
                                                    itemsPerPage={itemsPerPage}
                                                    totalPages={totalPages}
                                                    onPageChange={handlePageChange}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(modo === 'crear' || (modo === 'editar' && usuarioAEditar)) && (
                                        <div className="mt-8">
                                            <div className="bg-gradient-to-r from-gray-50 rounded-2xl shadow-inner border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-6 py-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-white/20 p-2 rounded-lg">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={modo === 'crear' ? "M12 6v6m0 0v6m0-6h6m-6 0H6" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                                                                </svg>
                                                            </div>
                                                            <h2 className="text-2xl font-bold text-white">
                                                                {modo === 'crear' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                                                            </h2>
                                                        </div>
                                                        {modo === 'editar' && (
                                                            <button
                                                                onClick={() => setModo('listar')}
                                                                className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                                </svg>
                                                                Volver a la lista
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>                                                <div className="p-6">                                                    <UsuarioForm 
                                                        usuarioInicial={modo === 'editar' ? usuarioAEditar : undefined} 
                                                        onGuardar={handleGuardar} 
                                                        onCancelar={handleCancelar} 
                                                        isLoading={savingUser}
                                                        showSuccessMessage={showFormSuccess}
                                                        savedUserData={savedUserData}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UsuariosPage;