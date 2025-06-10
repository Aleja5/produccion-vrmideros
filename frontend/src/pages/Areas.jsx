import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AreaForm from '../components/AreaForm';
import AreasList from '../components/AreasList';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';

const AreasPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 8 }) => {
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
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta área?')) {
            try {
                await axios.delete(`http://localhost:5000/api/areas/${id}`);
                cargarAreas(currentPage, searchText); // Recarga con la página y búsqueda actuales
            } catch (error) {
                console.error('Error al eliminar el área:', error);
            }
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setAreaAEditar(null);
    };


return (
    <>       
        <div className="flex bg-gray-100 h-screen">
            <SidebarAdmin />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto px-4 py-6">
                    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Áreas de Producción</h1>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <button
                                onClick={handleCrear}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out w-full md:w-auto order-first md:order-none flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Crear Nueva Área
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
                                        <AreasList
                                            areas={filteredAreas}
                                            onEditar={handleEditar}
                                            onEliminar={handleEliminar}
                                        />
                                    </div>
                                )}

                                {filteredAreas.length > 0 && modo === 'listar' && searchText && (
                                    <p className="mt-4 text-sm text-gray-600">
                                        {filteredAreas.length} resultados encontrados para "{searchText}"
                                    </p>
                                )}

                                {totalResults > 0 && modo === 'listar' && !searchText && totalPages > 1 && (
                                    <div className="mt-6">
                                        <Pagination
                                            totalResults={totalResults}
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}

                                {(modo === 'crear' || (modo === 'editar' && areaAEditar)) && (
                                    <div className="mt-8 p-6 bg-gray-50 rounded-xl shadow-inner">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-semibold text-gray-700">
                                                {modo === 'crear' ? 'Crear Nueva Área de Producción' : 'Editar Área de Producción'}
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
                                        <AreaForm
                                            areaInicial={modo === 'editar' ? areaAEditar : undefined}
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
};

export default AreasPage;
