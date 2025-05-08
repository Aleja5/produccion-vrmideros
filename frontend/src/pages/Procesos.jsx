import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ProcesoForm from '../components/ProcesoForm';
import ProcesosList from '../components/ProcesosList';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

const ProcesoPage = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
    const navigate = useNavigate();
    const [procesos, setProcesos] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [procesoAEditar, setProcesoAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de procesos

    const cargarProcesos = useCallback(async (page = 1, search = '') => {
            setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/procesos?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setProcesos(response.data.procesos);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error al cargar los procesos:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

        // Crea una versión debounced de la función cargarProcesos
    const cargarProcesosDebounced = useCallback(
        debounce((page, search) => {
        cargarProcesos(page, search);
        }, 500), // Espera 500ms después de que el usuario deje de escribir
        [cargarProcesos] // cargarProcesos debería estar en las dependencias
    );
    

    useEffect(() => {
        cargarProcesosDebounced(currentPage, searchText); // Llama a cargarProcesos con los valores correctos
        }, [currentPage, cargarProcesosDebounced, searchText]); // Se ejecuta cada vez que currentPage o searchText cambian      

    const handleCrear = () => {
        setModo('crear');
    };

    const handleEditar = (proceso) => {
        setProcesoAEditar(proceso);
        setModo('editar');
    };

    const handleGuardar = async (proceso) => {
        try {
            if (procesoAEditar) {
                await axios.put(`http://localhost:5000/api/procesos/${procesoAEditar._id}`, proceso);
            } else {
                await axios.post('http://localhost:5000/api/procesos', proceso);
            }
            cargarProcesos(currentPage, searchText); // Recarga con la página y búsqueda actuales
            setModo('listar');
            setProcesoAEditar(null);
        } catch (error) {
            console.error('Error al guardar el proceso:', error);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este proceso?')) {
            try {
                await axios.delete(`http://localhost:5000/api/procesos/${id}`);
                cargarProcesos(currentPage, searchText); // Recarga con la página y búsqueda actuales
            } catch (error) {
                console.error('Error al eliminar el proceso:', error);
            }
        }
    };

    const handleCancelar = () => {
        setModo('listar');
        setProcesoAEditar(null);
    };

    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value);
        };

    return (
        <div className="container mx-auto p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl font-semibold mb-4 text-gray-800">Gestión de Procesos</h1>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                    <p className="ml-3 text-gray-600">Cargando procesos...</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={handleCrear}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Crear Nuevo Proceso
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
                        variant="ghost" onClick={() => navigate('/admin-dashboard')}>
                        Atras
                        </button>
                    </div>
                </div>

                {modo === 'listar' && (
                    <div className="mt-6">
                        <ProcesosList procesos={procesos} onEditar={handleEditar} onEliminar={handleEliminar}/>
                    </div>
                )}

                {totalResults > 0 && modo === 'listar' && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}

                {modo === 'crear' && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">Crear Nuevo Proceso</h2>                    
                        <ProcesoForm onGuardar={handleGuardar} onCancelar={handleCancelar}
                        />
                    </div>
                )}
                    {modo === 'editar' && procesoAEditar && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Editar proceso</h2>
                            <ProcesoForm procesoInicial={procesoAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProcesoPage;

                    
                
                
                
            


                    



    
    

