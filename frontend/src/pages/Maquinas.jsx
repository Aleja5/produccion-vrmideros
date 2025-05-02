import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MaquinasList from '../components/MaquinasList';
import MaquinaForm from '../components/MaquinaForm';
import Pagination from '../components/Pagination';

const MaquinasPage = ({currentPage, totalResults, itemsPerPage, onPageChange}) => {
    const [maquinas, setMaquinas] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [maquinaAEditar, setMaquinaAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de máquinas

    const cargarMaquinas = async (page = 1, search = '') => { 
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
    };

    useEffect(() => {
        console.log('Valores en useEffect:', currentPage , searchText);
        cargarMaquinas( currentPage, searchText); // Llama a cargarMaquinas con los valores correctos
    }, [currentPage, searchText]);

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
        onPageChange(1); 
    }

    return (
        <div>
            <h1>Gestión de Máquinas</h1>
            {loading ? (
                <p>Cargando máquinas...</p>
            ) : (
                <>
                    {modo === 'listar' && (
                        <>
                            <button onClick={handleCrear}>Crear Nueva Máquina</button>
                            <div>
                                <label htmlFor="searchText">Buscar por Nombre:</label>
                                <input
                                    type="text"
                                    id="searchText"
                                    value={searchText}
                                    onChange={handleSearchTextChange}
                                />
                            </div>
                            <MaquinasList maquinas={maquinas} onEditar={handleEditar} onEliminar={handleEliminar} />
                            {totalResults > 0 && (
                                <Pagination
                                    totalResults={totalResults}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                />
                            )}
                        </>
                    )}
                    {modo === 'crear' && (
                        <MaquinaForm onGuardar={handleGuardar} onCancelar={handleCancelar} />
                    )}
                    {modo === 'editar' && maquinaAEditar && (
                        <MaquinaForm maquinaInicial={maquinaAEditar} onGuardar={handleGuardar} onCancelar={handleCancelar} />
                    )}
                </>
            )}
        </div>
    );
}

export default MaquinasPage;