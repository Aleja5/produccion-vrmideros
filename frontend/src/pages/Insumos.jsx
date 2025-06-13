import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import InsumosList from '../components/InsumosList';
import InsumoForm from '../components/InsumoForm';
import Pagination from '../components/Pagination';
import { SidebarAdmin } from '../components/SidebarAdmin';

const InsumosPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 8 }) => {
    const [insumos, setInsumos] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [insumoAEditar, setInsumoAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de insumos
    const [filteredInsumos, setFilteredInsumos] = useState([]);
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);


    const cargarInsumos = useCallback(async (page = 1, search = '') => {
            setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/insumos?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setInsumos(response.data.insumos);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);
        } catch (error) {
            console.error('Error al cargar los insumos:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        cargarInsumos(currentPage, searchText); 
    }, [currentPage, cargarInsumos, searchText]);

    useEffect(() => {
        if (insumos && Array.isArray(insumos)) { 
            if (searchText) {
                const filtered = insumos.filter(insumos =>
                    insumos.nombre.toLowerCase().includes(searchText.toLowerCase())
                );
                setFilteredInsumos(filtered);
            } else {
                setFilteredInsumos(insumos);
            }
        } else {
            setFilteredInsumos([]); // O algún otro valor por defecto seguro
        }
    }, [searchText, insumos]);

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleCrear = () => {
        setModo('crear');
    }

    const handleEditar = (insumo) => {
        setInsumoAEditar(insumo);
        setModo('editar');
    };

    const handleGuardar = async (insumo) => {
        try {
            if (insumoAEditar) {
                await axios.put(`http://localhost:5000/api/insumos/${insumoAEditar._id}`, insumo);
            } else {
                await axios.post('http://localhost:5000/api/insumos', insumo);
            }
            cargarInsumos(currentPage, searchText); // Recarga con la página y búsqueda actuales
            setModo('listar');
            setInsumoAEditar(null);
        } catch (error) {
            console.error('Error al guardar el insumo:', error);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este insumo?')) {
            try {
                await axios.delete(`http://localhost:5000/api/insumos/${id}`);
                cargarInsumos(currentPage, searchText); // Recarga con la página y búsqueda actuales
            } catch (error) {
                console.error('Error al eliminar el insumo:', error);
            }
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setInsumoAEditar(null);
    }

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
                                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Gestión de Insumos</h1>
                                    <p className="text-gray-600 mt-2 text-lg">Administra y controla todos los insumos necesarios para la producción</p>
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
                                    Crear Nuevo Insumo
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
                                                placeholder="Buscar insumos..."
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
                                    <span className="ml-4 text-lg text-gray-600 font-medium">Cargando insumos...</span>
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
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-800">Total de Insumos</h3>
                                                                <p className="text-gray-600">Insumos registrados en inventario</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-3xl font-bold text-blue-600">{totalResults}</span>
                                                            <p className="text-sm text-gray-500">disponibles</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <InsumosList insumos={filteredInsumos} onEditar={handleEditar} onEliminar={handleEliminar} />
                                        </div>
                                    )}

                                    {filteredInsumos.length > 0 && modo === 'listar' && searchText && (
                                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm font-medium text-green-800">
                                                    {filteredInsumos.length} resultado{filteredInsumos.length !== 1 ? 's' : ''} encontrado{filteredInsumos.length !== 1 ? 's' : ''} para "{searchText}"
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

                                    {(modo === 'crear' || (modo === 'editar' && insumoAEditar)) && (
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
                                                                {modo === 'crear' ? 'Crear Nuevo Insumo' : 'Editar Insumo'}
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
                                                    <InsumoForm
                                                        insumoInicial={modo === 'editar' ? insumoAEditar : undefined}
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

export default InsumosPage;