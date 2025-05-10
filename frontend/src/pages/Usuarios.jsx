import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UsuarioList from '../components/UsuarioList';
import UsuarioForm from '../components/UsuarioForm';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';
import Navbar from '../components/Navbar';

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
            <Navbar />
            <div className="flex bg-gray-100 h-screen">
                <SidebarAdmin />

                <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
                    <h1 className="text-2xl font-semibold mb-4 text-gray-800">Gestión de Usuarios</h1>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handleCrear} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >Crear Usuario</button>
                        {modo === 'listar' && (
                        <div className="flex items-center">
                            <label htmlFor="searchText" className="mr-2 text-gray-700">Buscar por Nombre:</label>
                            <input
                                type="text"
                                id="searchText"
                                value={searchText}
                                onChange={handleSearchTextChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-md transition cursor-pointer" 
                            onClick={() => navigate('/admin-dashboard')}>Atras</button>
                        </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-8 animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
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
                                <div className="mt-4">
                                    <Pagination
                                        totalResults={totalResults}
                                        currentPage={currentPage}
                                        onPageChange={handlePageChange}
                                        itemsPerPage={itemsPerPage}
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
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition cursor-pointer mb-4"
                                    >Atrás</button>
                                    <UsuarioForm usuario={usuarioAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default UsuariosPage;