import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import InsumosList from '../components/InsumosList';
import InsumoForm from '../components/InsumoForm';
import Pagination from '../components/Pagination';
import { useNavigate } from "react-router-dom";
import { debounce } from 'lodash';

const InsumosPage = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
    const navigate = useNavigate();
    const [insumos, setInsumos] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [insumoAEditar, setInsumoAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de insumos

    const cargarInsumos = useCallback(async (page = 1, search = '') => {
            setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/insumos?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setInsumos(response.data.insumos);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error al cargar los insumos:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

        // Crea una versión debounced de la función cargarInsumos
    const cargarInsumosDebounced = useCallback(
        debounce((page, search) => {
        cargarInsumos(page, search);
        }, 500), // Espera 500ms después de que el usuario deje de escribir
        [cargarInsumos] // cargarInsumos debería estar en las dependencias
    );

    useEffect(() => {
        console.log('Valores en useEffect:', currentPage, searchText);
        cargarInsumosDebounced(currentPage, searchText); // Llama a cargarInsumos con los valores correctos
    }, [currentPage, cargarInsumosDebounced, searchText]);

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

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
    };

    return (
        <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl font-semibold mb-4 text-gray-800">Insumos</h1>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                    <p className="ml-3 text-gray-600">Cargando insumos...</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handleCrear}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Crear Insumo
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
                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition cursor-pointer ml-2"
                                onClick={() => navigate('/admin-dashboard')}
                            >
                                Atras
                            </button>
                        </div>
                    </div>

                    {modo === 'listar' && (
                        <div className="overflow-x-auto">
                            <InsumosList insumos={insumos} onEditar={handleEditar} onEliminar={handleEliminar} />
                        </div>
                    )}

                    {totalResults > 0 && modo === 'listar' && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalResults={totalResults}
                                itemsPerPage={itemsPerPage}
                                onPageChange={onPageChange}
                            />
                        </div>
                    )}

                    {modo === 'crear' && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Crear Insumo</h2>
                            <InsumoForm onGuardar={handleGuardar} onCancelar={handleCancelar} />
                        </div>
                    )}
                    {modo === 'editar' && insumoAEditar && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Editar Insumo</h2>
                            <InsumoForm insumoInicial={insumoAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
                        </div>
                    )}                    
                </>
            )}
        </div>
    );
};

export default InsumosPage;