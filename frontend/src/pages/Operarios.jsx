import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OperarioList from '../components/OperarioList';
import OperarioForm from '../components/OperarioForm';
import Pagination from '../components/Pagination';
import { SidebarAdmin } from '../components/SidebarAdmin';
import Navbar from '../components/Navbar';
import { PlusCircle } from 'lucide-react'; // Importar el icono

const OperariosPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 8 }) => {
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

            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-4 sm:p-6 md:p-8">
                    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Operarios</h1>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <button
                                onClick={handleCrear}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out w-full md:w-auto order-first md:order-none flex items-center justify-center"
                            >
                                <PlusCircle size={20} className="mr-2" /> {/* Icono añadido */}
                                Crear Nuevo Operario
                            </button>

                            {modo === 'listar' && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                    <label htmlFor="searchText" className="sr-only"> 
                                        Buscar por Nombre:
                                    </label>
                                    <input
                                        type="text"
                                        id="searchText"
                                        value={searchText}
                                        onChange={handleSearchTextChange}
                                        placeholder="Buscar por Nombre..."
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
                                        <OperarioList operarios={filteredOperarios} onEditar={handleEditar} onEliminar={handleEliminar} />
                                    </div>
                                )}

                                {filteredOperarios.length > 0 && modo === 'listar' && searchText && (
                                    <p className="mt-2 text-gray-600">
                                        {filteredOperarios.length} resultados encontrados para "{searchText}"
                                    </p>
                                )}

                                {totalResults > 0 && modo === 'listar' && !searchText && totalPages > 1 && (
                                    <div className="mt-6">
                                        <Pagination
                                            totalResults={totalResults}
                                            currentPage={currentPage}
                                            totalPages={totalPages} // Asegúrate de que totalPages se pasa aquí
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}

                                {(modo === 'crear' || (modo === 'editar' && operarioAEditar)) && (
                                    <div className="mt-8 p-6 bg-gray-50 rounded-xl shadow-inner">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-xl font-semibold text-gray-800">
                                                {modo === 'crear' ? 'Crear Nuevo Operario' : 'Editar Operario'}
                                            </h2>
                                            {modo === 'editar' && (
                                                <button
                                                    onClick={() => setModo('listar')}
                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out"
                                                >
                                                    Volver a la lista
                                                </button>
                                            )}
                                        </div>
                                        <OperarioForm 
                                            operarioInicial={modo === 'editar' ? operarioAEditar : undefined} 
                                            onGuardar={handleGuardar} 
                                            onCancelar={handleCancelar} 
                                        />
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
}  
    
export default OperariosPage;