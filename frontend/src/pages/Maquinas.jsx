import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MaquinasList from '../components/MaquinasList';
import MaquinaForm from '../components/MaquinaForm';
import Pagination from '../components/Pagination';
import { useNavigate } from "react-router-dom";
import { SidebarAdmin } from '../components/SidebarAdmin';

const MaquinasPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 5 }) => {
    const navigate = useNavigate();
    const [maquinas, setMaquinas] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [maquinaAEditar, setMaquinaAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de máquinas
    const [filteredMaquinas, setFilteredMaquinas] = useState([]); 
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);


    const cargarMaquinas = useCallback(async (page = 1, search = '') => {
            setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/maquinas?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setMaquinas(response.data.maquinas);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);
        } catch (error) {
            console.error('Error al cargar las máquinas:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        cargarMaquinas(currentPage, searchText); // Llama a cargarMaquinas con los valores correctos
    }, [currentPage, cargarMaquinas, searchText]);

    useEffect(() => {
      if (maquinas && Array.isArray(maquinas)) { 
          if (searchText) {
              const filtered = maquinas.filter(maquinas =>
                  maquinas.nombre.toLowerCase().includes(searchText.toLowerCase())
              );
              setFilteredMaquinas(filtered);
          } else {
              setFilteredMaquinas(maquinas);
          }
      } else {
          setFilteredMaquinas([]); // O algún otro valor por defecto seguro
      }
  }, [searchText, maquinas]);

    const handleSearchTextChange = (event) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
};

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };


    const handleCrear = () => {
        setModo('crear');
    };

    const handleEditar = (maquina) => {
        setMaquinaAEditar(maquina);
        setModo('editar');
    };

    const handleGuardar = async (maquina) => {
        try {
            if (maquinaAEditar) {
                await axios.put(`http://localhost:5000/api/maquinas/${maquinaAEditar._id}`, maquina);
            } else {
                await axios.post('http://localhost:5000/api/maquinas', maquina);
            }
            cargarMaquinas(currentPage, searchText); // Recarga con la página y búsqueda actuales
            setModo('listar');
            setMaquinaAEditar(null);
        } catch (error) {
            console.error('Error al guardar la máquina:', error);
        }
    };    const handleEliminar = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/maquinas/${id}`);
            cargarMaquinas(currentPage, searchText); // Recarga con la página y búsqueda actuales
        } catch (error) {
            console.error('Error al eliminar la máquina:', error);
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setMaquinaAEditar(null);
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
                                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Gestión de Máquinas</h1>
                                    <p className="text-gray-600 mt-2 text-lg">Administra y controla todas las máquinas y equipos de producción</p>
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
                                    Crear Nueva Máquina
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
                                                placeholder="Buscar máquinas..."
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
                                    <span className="ml-4 text-lg text-gray-600 font-medium">Cargando máquinas...</span>
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
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-800">Total de Máquinas</h3>
                                                                <p className="text-gray-600">Equipos y máquinas registradas</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-3xl font-bold text-blue-600">{totalResults}</span>
                                                            <p className="text-sm text-gray-500">activas</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <MaquinasList maquinas={filteredMaquinas} onEditar={handleEditar} onEliminar={handleEliminar} />
                                        </div>
                                    )}

                                    {filteredMaquinas.length > 0 && modo === 'listar' && searchText && (
                                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm font-medium text-green-800">
                                                    {filteredMaquinas.length} resultado{filteredMaquinas.length !== 1 ? 's' : ''} encontrado{filteredMaquinas.length !== 1 ? 's' : ''} para "{searchText}"
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

                                    {(modo === 'crear' || (modo === 'editar' && maquinaAEditar)) && (
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
                                                                {modo === 'crear' ? 'Crear Nueva Máquina' : 'Editar Máquina'}
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
                                                    <MaquinaForm
                                                        maquinaInicial={modo === 'editar' ? maquinaAEditar : undefined}
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
};

export default MaquinasPage;