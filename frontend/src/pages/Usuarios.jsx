import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UsuarioList from '../components/UsuarioList';
import UsuarioForm from '../components/UsuarioForm';
import { SidebarAdmin } from '../components/SidebarAdmin';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PlusCircle, Search, Users } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar', 'success'
    const [usuarioAEditar, setUsuarioAEditar] = useState(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Nuevo estado para controlar el mensaje de éxito y los datos guardados
    const [showFormSuccess, setShowFormSuccess] = useState(false);
    const [savedUserData, setSavedUserData] = useState(null);

    const itemsPerPage = 10;

    const cargarUsuarios = useCallback(async (page = 1, search = '') => {
        setIsLoadingUsers(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/usuarios?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setUsuarios(response.data.usuarios || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalResults(response.data.totalResults || 0);
        } catch (error) {
            console.error('Error al cargar los usuarios:', error.response?.data || error.message);
            toast.error('Error al cargar usuarios.');
            setUsuarios([]);
            setTotalPages(0);
            setTotalResults(0);
        } finally {
            setIsLoadingUsers(false);
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
        setUsuarioAEditar(null);
        setShowFormSuccess(false); // Resetear el estado de éxito al cambiar a crear
        setSavedUserData(null);
    };

    const handleEditar = (usuario) => {
        setModo('editar');
        setUsuarioAEditar(usuario);
        setShowFormSuccess(false); // Resetear el estado de éxito al cambiar a editar
        setSavedUserData(null);
    };

    const handleGuardar = async (usuarioData) => {
        setIsSavingUser(true);
        try {
            let res;
            if (usuarioAEditar) {
                res = await axios.put(`http://localhost:5000/api/usuarios/${usuarioAEditar._id}`, usuarioData);
                toast.success('Usuario actualizado exitosamente!');
            } else {
                res = await axios.post('http://localhost:5000/api/usuarios', usuarioData);
                toast.success('Usuario creado exitosamente!');
            }

            setSavedUserData(res.data.usuario); // Almacenar los datos del usuario guardado
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
            console.error('Error al guardar el usuario:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Error al guardar el usuario.');
            setShowFormSuccess(false); // Asegurarse de que el mensaje de éxito no se muestre en caso de error
            throw error;
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleEliminar = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/usuarios/${id}`);
            toast.success('Usuario eliminado exitosamente.');
            cargarUsuarios(currentPage, searchText);
        } catch (error) {
            console.error('Error al eliminar el usuario:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Error al eliminar el usuario.');
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setUsuarioAEditar(null);
        setShowFormSuccess(false); // Asegurarse de que el mensaje de éxito no se muestre al cancelar
        setSavedUserData(null);
    };

    return (
        <>
            <Navbar />
            <div className="flex bg-gray-100 h-screen overflow-hidden">
                <SidebarAdmin className="h-full" />

                <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 md:p-8">
                    <ToastContainer />

                    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                            <Users className="h-8 w-8 mr-3 text-blue-600" />
                            Gestión de Usuarios
                        </h1>

                        {(modo === 'listar' || modo === 'success') && ( // Solo muestra los botones y búsqueda si estamos en listar o ya se guardó y se mostrará el éxito
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                {modo === 'listar' && ( // Solo muestra el botón Crear Usuario si estamos listando
                                    <Button
                                        onClick={handleCrear}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out w-full md:w-auto flex items-center justify-center"
                                    >
                                        <PlusCircle className="h-5 w-5 mr-2" />
                                        Crear Usuario
                                    </Button>
                                )}
                                {modo === 'listar' && ( // Solo muestra la barra de búsqueda si estamos listando
                                    <div className="relative w-full md:w-auto flex-grow">
                                        <Input
                                            type="text"
                                            id="searchText"
                                            value={searchText}
                                            onChange={handleSearchTextChange}
                                            placeholder="Buscar por nombre..."
                                            className="appearance-none block w-full rounded-lg border border-gray-300 shadow-sm py-2.5 pl-10 pr-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        )}

                        {modo === 'listar' && (
                            <>
                                <UsuarioList
                                    usuarios={usuarios}
                                    onEditar={handleEditar}
                                    onEliminar={handleEliminar}
                                    isLoading={isLoadingUsers}
                                />
                                {totalPages > 1 && (
                                    <div className="mt-6">
                                        {/* <Pagination
                                            currentPage={currentPage}
                                            totalResults={totalResults}
                                            itemsPerPage={itemsPerPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                        /> */}
                                    </div>
                                )}
                            </>
                        )}

                        {(modo === 'crear' || modo === 'editar' || modo === 'success') && (
                            <div className="mt-6">
                                <UsuarioForm
                                    usuarioInicial={usuarioAEditar}
                                    onGuardar={handleGuardar}
                                    onCancelar={handleCancelar}
                                    isLoading={isSavingUser}
                                    showSuccessMessage={showFormSuccess} // Pasa el nuevo estado
                                    savedUserData={savedUserData} // Pasa los datos guardados
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default UsuariosPage;