import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OperarioList from '../components/OperarioList';
import OperarioForm from '../components/OperarioForm';
import Pagination from '../components/Pagination';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { PlusCircle } from 'lucide-react'; // Importar el icono

const OperariosPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 5 }) => {
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
    try {
      await axios.delete(`http://localhost:5000/api/operarios/${id}`);
      cargarOperarios(currentPage, searchText);
    } catch (error) {
      console.error('Error al eliminar operario:', error);
    }
  };

  const handleCancelar = () => {
    setModo('listar');
    setOperarioAEditar(null);
  };

  return (
    <>       
        <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 h-screen">
            <SidebarAdmin />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto px-4 py-6">
                    {/* Header Card Mejorado */}
                    <div className="bg-gradient-to-r from-white to-gray-50 shadow-2xl rounded-3xl p-6 md:p-8 border border-gray-100 mb-6">
                        <div className="flex items-center gap-4 mb-6">                            
                            <div>
                                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Gestión de Operarios</h1>
                                <p className="text-gray-600 mt-2 text-lg">Administra y gestiona el personal operativo de la planta de producción</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <button
                                onClick={handleCrear}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full md:w-auto order-first md:order-none flex items-center justify-center group"
                            >
                                <PlusCircle size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                Crear Nuevo Operario
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
                                            placeholder="Buscar operarios..."
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
                    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100">                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
                                    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-gray-600 absolute top-0 left-0"></div>
                                </div>
                                <span className="ml-4 text-lg text-gray-600 font-medium">Cargando operarios...</span>
                            </div>
                        ) : (
                            <>
                                {modo === 'listar' && (
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
                                                            <h3 className="text-lg font-semibold text-gray-800">Total de Operarios</h3>
                                                            <p className="text-gray-600">Personal operativo registrado</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-3xl font-bold text-blue-600">{totalResults}</span>
                                                        <p className="text-sm text-gray-500">activos</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <OperarioList operarios={filteredOperarios} onEditar={handleEditar} onEliminar={handleEliminar} />
                                    </div>
                                )}

                                {filteredOperarios.length > 0 && modo === 'listar' && searchText && (
                                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm font-medium text-green-800">
                                                {filteredOperarios.length} resultado{filteredOperarios.length !== 1 ? 's' : ''} encontrado{filteredOperarios.length !== 1 ? 's' : ''} para "{searchText}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {totalResults > 0 && modo === 'listar' && !searchText && totalPages > 1 && (
                                    <div className="mt-8 flex justify-center">
                                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                                            <Pagination
                                                totalResults={totalResults}
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                itemsPerPage={itemsPerPage}
                                                onPageChange={handlePageChange}
                                            />
                                        </div>
                                    </div>
                                )}

                                {(modo === 'crear' || (modo === 'editar' && operarioAEditar)) && (
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
                                                            {modo === 'crear' ? 'Crear Nuevo Operario' : 'Editar Operario'}
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
                                            </div>
                                            <div className="p-6">
                                                <OperarioForm 
                                                    operarioInicial={modo === 'editar' ? operarioAEditar : undefined} 
                                                    onGuardar={handleGuardar} 
                                                    onCancelar={handleCancelar} 
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
}  
    
export default OperariosPage;