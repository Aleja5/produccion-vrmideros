import React, {useState, useEffect} from 'react';
import axios from 'axios';
import InsumosList from '../components/InsumosList';
import InsumoForm from '../components/InsumoForm';
import Pagination from '../components/Pagination';

const InsumosPage = ({currentPage, totalResults, itemsPerPage, onPageChange}) => {
    const [insumos, setInsumos] = useState([]);
    const [modo, setModo] = useState('listar'); // 'listar', 'crear', 'editar'
    const [insumoAEditar, setInsumoAEditar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [searchText, setSearchText] = useState(''); // Para la búsqueda de insumos

    const cargarInsumos = async (page = 1, search = '') => { 
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
    };

    useEffect(() => {
        console.log('Valores en useEffect:', currentPage , searchText);
        cargarInsumos( currentPage, searchText); // Llama a cargarInsumos con los valores correctos
    }, [currentPage, searchText]);

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
        onPageChange(1); 
    };

    return (
        <div className="container mt-4">
            <h1>Insumos</h1>
            <input
                type="text"
                placeholder="Buscar insumos..."
                value={searchText}
                onChange={handleSearchTextChange}
                className="form-control mb-3"
            />
            {modo === 'listar' && (
                <div>
                    <button className="btn btn-primary mb-3" onClick={handleCrear}>Crear Insumo</button>
                    {loading ? (
                        <p>Cargando...</p>
                    ) : (
                        <InsumosList insumos={insumos} onEditar={handleEditar} onEliminar={handleEliminar} />
                    )}
                    <Pagination
                        currentPage={currentPage}
                        totalResults={totalResults}
                        itemsPerPage={itemsPerPage}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
            {(modo === 'crear' || modo === 'editar') && (
                <InsumoForm
                    insumo={modo === 'editar' ? insumoAEditar : null}
                    onGuardar={handleGuardar}
                    onCancelar={handleCancelar}
                />
            )}
        </div>
    );
}

export default InsumosPage;





