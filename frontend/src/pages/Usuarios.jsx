import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UsuarioList from '../components/UsuarioList';
import UsuarioForm from '../components/UsuarioForm';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';

const UsuariosPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 10 }) => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [usuarioAEditar, setUsuarioAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de usuarios
    const [filteredUsuarios, setFilteredUsuarios] = useState([]); 
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);

    const cargarUsuarios = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/usuarios?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setUsuarios(response.data.usuarios);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);
        } catch (error) {
            console.error('Error al cargar los usuarios:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        cargarUsuarios(currentPage, searchText); // Llama a cargarUsuarios con los valores correctos
    }, [currentPage, cargarUsuarios, searchText]);

    useEffect(() => {
      if (usuarios && Array.isArray(usuarios)) { 
          if (searchText) {
              const filtered = usuarios.filter(usuario =>
                  usuario.nombre.toLowerCase().includes(searchText.toLowerCase())
              );
              setFilteredUsuarios(filtered);
          } else {
              setFilteredUsuarios(usuarios);
          }
      } else {
          setFilteredUsuarios([]); // O algún otro valor por defecto seguro
      }
    }, [searchText, usuarios]);

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
        setCurrentPage(1); // Resetear la página al buscar
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleCrear = () => {
        setModo('crear');    
    };

    const handleEditar = (usuario) => {
        setModo('editar');
        setUsuarioAEditar(usuario);
    };

    const handleGuardar = async (usuario) => {
        try {
            if (usuarioAEditar) {
                // Actualizar usuario
                await axios.put(`http://localhost:5000/api/usuarios/${usuarioAEditar._id}`, usuario);
            }else {
                // Crear nuevo usuario
                await axios.post('http://localhost:5000/api/usuarios', usuario);
            }
            cargarUsuarios(currentPage, searchText); // Recargar usuarios después de crear/editar
            setModo('listar'); // Volver al modo listar
            setUsuarioAEditar(null);
        } catch (error) {
            console.error('Error al guardar el usuario:', error);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            try {
                await axios.delete(`http://localhost:5000/api/usuarios/${id}`);
                cargarUsuarios(currentPage, searchText); // Recargar usuarios después de eliminar
            } catch (error) {
                console.error('Error al eliminar el usuario:', error);
            }
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setUsuarioAEditar(null);
    };

    return (
        <>        
            <div className="flex bg-gray-100 h-screen">
                <SidebarAdmin />

                <div className="flex-1 overflow-auto">
                    <div className="container mx-auto px-4 py-6">
                        <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Usuarios</h1>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <button
                                onClick={handleCrear}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out w-full md:w-auto order-first md:order-none flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Crear Usuario
                            </button>
                        {modo === 'listar' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                            <label htmlFor="searchText" className="sr-only">Buscar por Nombre:</label>
                            <input
                                type="text"
                                id="searchText"
                                value={searchText}
                                onChange={handleSearchTextChange}
                                placeholder="Buscar por nombre..."
                                className="appearance-none block w-full sm:w-auto flex-grow rounded-lg border border-gray-300 shadow-sm py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />                            
                        </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                        </div>
                    ) : (
                        <>
                        {modo === 'listar' && (
                            <div className="overflow-x-auto">
                                <UsuarioList usuarios={filteredUsuarios} onEditar={handleEditar} onEliminar={handleEliminar} />
                            </div>
                        )}

                        {filteredUsuarios.length > 0 && modo === 'listar' && searchText && (
                            <p className="mt-2 text-gray-600">{filteredUsuarios.length} resultados encontrados para "{seachText}"</p>
                        )}
                            {totalResults > 0 && modo === 'listar' && !searchText && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalResults={totalResults}
                                        itemsPerPage={itemsPerPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}

                            {modo === 'crear' && (
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Crear Nuevo Usuario</h2>
                                    <UsuarioForm onGuardar={handleGuardar} onCancelar={handleCancelar} />
                                </div>
                            )}   

                            {modo === 'editar' && usuarioAEditar && (
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Editar Usuario</h2>
                                    <button
                                        onClick={() => setModo('listar')}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out"
                                    >Volver a la lista</button>
                                    <UsuarioForm usuario={usuarioAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
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