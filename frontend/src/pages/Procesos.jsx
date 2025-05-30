import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ProcesoForm from '../components/ProcesoForm';
import ProcesosList from '../components/ProcesosList';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';
import Navbar from '../components/Navbar';

const ProcesoPage = ({ currentPage: propCurrentPage, totalResults: propTotalResults, itemsPerPage = 8 }) => {
    const navigate = useNavigate();
    const [procesos, setProcesos] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [procesoAEditar, setProcesoAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de procesos
    const [filteredProcesos, setFilteredProcesos] = useState([]); 
    const [currentPage, setCurrentPage] = useState(propCurrentPage || 1);
    const [totalResults, setTotalResults] = useState(propTotalResults || 0);

    const cargarProcesos = useCallback(async (page = 1, search = '') => {
            setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/procesos?page=${page}&limit=${itemsPerPage}&search=${search}`);
            setProcesos(response.data.procesos);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalResults);
        } catch (error) {
            console.error('Error al cargar los procesos:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        cargarProcesos(currentPage, searchText); // Llama a cargarProcesos con los valores correctos
        }, [currentPage, cargarProcesos, searchText]); // Se ejecuta cada vez que currentPage o searchText cambian      


    useEffect(() => {
        if (procesos && Array.isArray(procesos)) { 
            if (searchText) {
                const filtered = procesos.filter(procesos =>
                    procesos.nombre.toLowerCase().includes(searchText.toLowerCase())
                );
                setFilteredProcesos(filtered);
            } else {
                setFilteredProcesos(procesos);
            }
        } else {
            setFilteredProcesos([]); // O algún otro valor por defecto seguro
        }
    }, [searchText, procesos]);

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



    return (
        <>
        <Navbar />
        <div className="flex bg-gray-100 h-screen">
            <SidebarAdmin />

            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-4 sm:p-6 md:p-8"> 
                    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Procesos</h1>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <button
                            onClick={handleCrear}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out w-full md:w-auto order-first md:order-none flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Crear Nuevo Proceso
                        </button>
                    {modo === 'listar' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <label htmlFor="searchText" className="sr-only">Buscar por Nombre:</label>
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
                        <div className="flex justify-center items-center py-12 animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"
                        ></div>
                    ) : (
                        <>
                        {modo === 'listar' && (
                            <div className="overflow-x-auto">
                                <ProcesosList procesos={filteredProcesos} onEditar={handleEditar} onEliminar={handleEliminar}/>
                            </div>
                        )}

                        {filteredProcesos.length > 0 && modo === 'listar' && searchText && (
                            <p className="mt-2 text-gray-600">{filteredProcesos.length} resultados encontrados para "{searchText}"</p>
                        )}

                        {totalResults > 0 && modo === 'listar' && !searchText && (
                            <div className="mt-6">
                                <Pagination
                                    totalResults={totalResults}
                                    currentPage={currentPage}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
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
                                <button
                                    onClick={() => setModo('listar')}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out"
                                >Volver a la lista</button>
                                <ProcesoForm procesoInicial={procesoAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
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

export default ProcesoPage;















