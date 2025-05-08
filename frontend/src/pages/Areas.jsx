import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AreaForm from '../components/AreaForm';
import AreasList from '../components/AreasList';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

const AreasPage = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [areaAEditar, setAreaAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState('');

    const cargarAreas = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/areas?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setAreas(response.data.areas);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error al cargar las áreas:', error);
        } finally {
            setLoading(false);
        }
    },[itemsPerPage]);

      // Crea una versión debounced de la función cargarAreas
    const cargarAreasDebounced = useCallback(
        debounce((page, search) => {
        cargarAreas(page, search);
        }, 500), // Espera 500ms después de que el usuario deje de escribir
        [cargarAreas] // cargarAreas debería estar en las dependencias
    );



    useEffect(() => {
        cargarAreasDebounced(currentPage, searchText); // Llama a cargarAreas con los valores correctos
    }, [currentPage, cargarAreasDebounced, searchText]); // Se ejecuta cada vez que currentPage cambia

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

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
    };

    console.log('Renderizando AreasPage');

    return (
        <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Gestión de Areas</h1>

        {loading ? (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                <p className="ml-3 text-gray-600">Cargando areas...</p>
            </div>
        ) : (
            <>
               <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={handleCrear}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Crear Area
                    </button>
                    <div className="flex items-center">
                        <label htmlFor="searchText" className="mr-2 text-gray-700">
                            Buscar por Nombre:
                        </label>
                        <input
                            type="text"
                            id="searchText"
                            value={searchText}
                            onChange={handleSearchTextChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-md transition cursor-pointer ml-2" 
                         onClick={() => navigate('/admin-dashboard')}>
                        Atras
                        </button>
                    </div>
                </div> 

                {modo === 'listar' && (
                    <div className="mt-6">
                        <AreasList areas={areas} onEditar={handleEditar} onEliminar={handleEliminar} />
                    </div>
                )}

                {totalResults > 0 && modo === 'listar' && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            onPageChange={onPageChange}
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
