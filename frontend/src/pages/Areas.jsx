import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AreaForm from '../components/AreaForm';
import AreasList from '../components/AreasList';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';

const AreasPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 5 }) => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [areaAEditar, setAreaAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [filteredAreas, setFilteredAreas] = useState([]);
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);

    const cargarAreas = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/areas?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setAreas(response.data.areas);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);
        } catch (error) {
            console.error('Error al cargar las áreas:', error);
        } finally {
            setLoading(false);
        }
    },[itemsPerPage]);

    useEffect(() => {
        cargarAreas(currentPage, searchText); // Carga inicial o cuando cambia la página/tamaño
    }, [currentPage, cargarAreas, searchText]);


    useEffect(() => {
        if (areas && Array.isArray(areas)) { 
            if (searchText) {
                const filtered = areas.filter(area =>
                    area.nombre.toLowerCase().includes(searchText.toLowerCase())
                );
                setFilteredAreas(filtered);
            } else {
                setFilteredAreas(areas);
            }
        } else {
            setFilteredAreas([]); // O algún otro valor por defecto seguro
        }
    }, [searchText, areas]);

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleCrear = () => {
        setModo('crear');
    };

    const handleEditar = (area) => {
        setAreaAEditar(area);
        setModo('editar');
    };

    const handleGuardar = async (area) => {
        try {
            if (areaAEditar) {
                await axios.put(`http://localhost:5000/api/areas/${areaAEditar._id}`, area);
            } else {
                await axios.post('http://localhost:5000/api/areas', area);
            }
            cargarAreas(currentPage, searchText); // Recarga con la página y búsqueda actuales
            setModo('listar');
            setAreaAEditar(null);
        } catch (error) {
            console.error('Error al guardar el área:', error);
        }
    };    const handleEliminar = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/areas/${id}`);
            cargarAreas(currentPage, searchText); // Recarga con la página y búsqueda actuales
        } catch (error) {
            console.error('Error al eliminar el área:', error);
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setAreaAEditar(null);
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
                                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Gestión de Áreas de Producción</h1>
                                <p className="text-gray-600 mt-2 text-lg">Administra y organiza las diferentes áreas de tu planta de producción</p>
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
                                Crear Nueva Área
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
                                            placeholder="Buscar áreas de producción..."
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
                    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100">                        
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
                                    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-gray-600 absolute top-0 left-0"></div>
                                </div>
                                <span className="ml-4 text-lg text-gray-600 font-medium">Cargando áreas...</span>
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-800">Total de Áreas</h3>
                                                            <p className="text-gray-600">Áreas de producción registradas</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-3xl font-bold text-blue-600">{totalResults}</span>
                                                        <p className="text-sm text-gray-500">activas</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <AreasList
                                            areas={filteredAreas}
                                            onEditar={handleEditar}
                                            onEliminar={handleEliminar}
                                        />
                                    </div>
                                )}

                                {filteredAreas.length > 0 && modo === 'listar' && searchText && (
                                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm font-medium text-green-800">
                                                {filteredAreas.length} resultado{filteredAreas.length !== 1 ? 's' : ''} encontrado{filteredAreas.length !== 1 ? 's' : ''} para "{searchText}"
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

                                {(modo === 'crear' || (modo === 'editar' && areaAEditar)) && (
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
                                                            {modo === 'crear' ? 'Crear Nueva Área de Producción' : 'Editar Área de Producción'}
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
                                                <AreaForm
                                                    areaInicial={modo === 'editar' ? areaAEditar : undefined}
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

export default AreasPage;
