import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AreaForm from '../components/AreaForm';
import AreasList from '../components/AreasList';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';

const AreasPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 10 }) => {
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
        <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl font-semibold mb-4 text-gray-800">Gestión de Areas de Producción</h1>
            <div className="flex justify-between items-center mb-4">
            <button onClick={handleCrear} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >Crear Nueva Area de Producción</button>
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
        </div>

        {loading ? (
            <div className="flex justify-center items-center py-8 animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid">
                <p className="ml-3 text-gray-600">Cargando areas...</p>
            </div>
        ) : (
            <>
                {modo === 'listar' && (
                    <div className="overflow-x-auto">
                        <AreasList areas={filteredAreas} onEditar={handleEditar} onEliminar={handleEliminar} />
                    </div>
                )}

                {filteredAreas.length > 0 && modo === 'listar' && searchText && (
                    <p className="mt-2 text-gray-600">{filteredAreas.length} resultados encontrados para "{searchText}"</p>
                )}

                {totalResults > 0 && modo === 'listar' && !searchText && (
                    <div className="mt-4">
                        <Pagination
                            totalResults={totalResults}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {modo === 'crear' && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">Crear Area de Producción</h2>
                        <AreaForm onGuardar={handleGuardar} onCancelar={handleCancelar}/>
                    </div>
                )} 
                {modo === 'editar' && areaAEditar && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">Editar Area de Producción</h2>
                        <AreaForm areaInicial={areaAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar}/>
                    </div>
                )}
            </>
        )}
    </div>
    );
};

export default AreasPage;
