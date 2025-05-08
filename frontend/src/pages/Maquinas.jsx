import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MaquinasList from '../components/MaquinasList';
import MaquinaForm from '../components/MaquinaForm';
import Pagination from '../components/Pagination';
import { useNavigate } from "react-router-dom";
import { debounce } from 'lodash';

const MaquinasPage = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
    const navigate = useNavigate();
    const [maquinas, setMaquinas] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [maquinaAEditar, setMaquinaAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de máquinas

    const cargarMaquinas = useCallback(async (page = 1, search = '') => {
            setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/maquinas?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setMaquinas(response.data.maquinas);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error al cargar las máquinas:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

      // Crea una versión debounced de la función cargarMaquinas
    const cargarMaquinasDebounced = useCallback(
        debounce((page, search) => {
        cargarMaquinas(page, search);
        }, 500), // Espera 500ms después de que el usuario deje de escribir
        [cargarMaquinas] // cargarMaquinas debería estar en las dependencias
    );


    useEffect(() => {
        console.log('Valores en useEffect:', currentPage, searchText);
        cargarMaquinasDebounced(currentPage, searchText); // Llama a cargarMaquinas con los valores correctos
    }, [currentPage, cargarMaquinasDebounced, searchText]);

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
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta máquina?')) {
            try {
                await axios.delete(`http://localhost:5000/api/maquinas/${id}`);
                cargarMaquinas(currentPage, searchText); // Recarga con la página y búsqueda actuales
            } catch (error) {
                console.error('Error al eliminar la máquina:', error);
            }
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setMaquinaAEditar(null);
    };

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
    };

    return (
        <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl font-semibold mb-4 text-gray-800">Gestión de Máquinas</h1>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                    <p className="ml-3 text-gray-600">Cargando máquinas...</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handleCrear}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Crear Maquina
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
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-md transition cursor-pointer" 
                                variant="ghost" onClick={() => navigate('/admin-dashboard')}>
                                Atras
                                </button>
                            </div>
                        </div>

                    {modo === 'listar' && (
                        <div className="overflow-x-auto">
                            <MaquinasList maquinas={maquinas} onEditar={handleEditar} onEliminar={handleEliminar} />
                        </div>
                    )}

                    {totalResults > 0 && modo === 'listar' && (
                        <div className="mt-4">
                            <Pagination
                                totalResults={totalResults}
                                currentPage={currentPage}
                                onPageChange={onPageChange}
                                itemsPerPage={itemsPerPage}
                            />
                        </div>
                    )}

                    {modo === 'crear' && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Crear Nueva Máquina</h2>
                            <MaquinaForm onGuardar={handleGuardar} onCancelar={handleCancelar} />
                        </div>
                    )}

                    {modo === 'editar' && maquinaAEditar && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Editar Máquina</h2>
                            <MaquinaForm maquinaInicial={maquinaAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MaquinasPage;