import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OperarioList from '../components/OperarioList';
import OperarioForm from '../components/OperarioForm';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';
import Navbar from '../components/Navbar';

const OperariosPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 10 }) => {
    const navigate = useNavigate();
    const [operarios, setOperarios] = useState([]);
    const [modo, setModo] = useState('listar');
    const [operarioAEditar, setOperarioAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [filteredOperarios, setFilteredOperarios] = useState([]); 
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);

    const cargarOperarios = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/operarios?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setOperarios(response.data.operarios);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);
        } catch (error) {
            console.error('Error al cargar operarios:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        cargarOperarios(currentPage, searchText); // Carga inicial o cuando cambia la página/tamaño
    }, [currentPage, cargarOperarios, searchText]);

    useEffect(() => {
      if (operarios && Array.isArray(operarios)) { 
          if (searchText) {
              const filtered = operarios.filter(operario =>
                  operario.name.toLowerCase().includes(searchText.toLowerCase())
              );
              setFilteredOperarios(filtered);
          } else {
              setFilteredOperarios(operarios);
          }
      } else {
          setFilteredOperarios([]); // O algún otro valor por defecto seguro
      }
  }, [searchText, operarios]);

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

  const handleEditar = (operario) => {
    setOperarioAEditar(operario);
    setModo('editar');
  };

  const handleGuardar = async (operario) => {
    try {
      if (operarioAEditar) {
        await axios.put(`http://localhost:5000/api/operarios/${operarioAEditar._id}`, operario);
      } else {
        await axios.post('http://localhost:5000/api/operarios', operario);
      }
      cargarOperarios(currentPage, searchText);
      setModo('listar');
      setOperarioAEditar(null);
    } catch (error) {
      console.error('Error al guardar operario:', error);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este operario?')) {
      try {
        await axios.delete(`http://localhost:5000/api/operarios/${id}`);
        cargarOperarios(currentPage, searchText);
      } catch (error) {
        console.error('Error al eliminar operario:', error);
      }
    }
  };

  const handleCancelar = () => {
    setModo('listar');
    setOperarioAEditar(null);
  };


  return (
    <>
        <Navbar />
        <div className="flex bg-gray-100 h-screen">
            <SidebarAdmin />

            <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
                <h1 className="text-2xl font-semibold mb-4 text-gray-800">Gestión de Operarios</h1>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handleCrear} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >Crear Nuevo Operario</button>
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
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-md transition cursor-pointer ml-2" 
                        onClick={() => navigate('/admin-dashboard')}>Atras</button>
                    </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8 animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"
                    ></div>
                ) : (
                    <>
                        {modo === 'listar' && (
                            <div className="overflow-x-auto">
                                <OperarioList operarios={filteredOperarios} onEditar={handleEditar} onEliminar={handleEliminar} />
                            </div>
                        )}

                        {filteredOperarios.length > 0 && modo === 'listar' && searchText && (
                            <p className="mt-2 text-gray-600">{filteredOperarios.length} resultados encontrados para "{searchText}"</p>
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
                              <h2 className="text-xl font-semibold mb-2 text-gray-800">Crear Nuevo Operario</h2>
                              <OperarioForm onGuardar={handleGuardar} onCancelar={handleCancelar} />
                          </div>
                        )}
                        {modo === 'editar' && operarioAEditar && (
                          <div className="mt-6">
                              <h2 className="text-xl font-semibold mb-2 text-gray-800">Editar Operario</h2>
                              <button
                                  onClick={() => setModo('listar')}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition cursor-pointer mb-4"
                              >Atrás</button>
                              <OperarioForm operarioInicial={operarioAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
                          </div>
                        )}
                        </>        
                      )}
                      </div>
                  </div>
          </>
      );
}  
    
export default OperariosPage;