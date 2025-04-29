import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';


const EditarProduccion = () => {
    const { id } = useParams(); // ID de la producción a editar
    const [oti, setOti] = useState('');
    const [fecha, setFecha] = useState('');
    const [proceso, setProceso] = useState('');
    const [areaProduccion, setAreaProduccion] = useState('');
    const [maquina, setMaquina] = useState('');
    const [tiempoPreparacion, setTiempoPreparacion] = useState('');
    const [tiempoOperacion, setTiempoOperacion] = useState('');
    const [otis, setOtis] = useState([]);
    const [procesos, setProcesos] = useState([]);
    const [areasProduccion, setAreasProduccion] = useState([]);
    const [maquinas, setMaquinas] = useState([]);
    const navigate = useNavigate();

    // Cargar datos iniciales de la producción y opciones disponibles
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Obtener los datos de la producción específica
                const produccionResponse = await axios.get(`http://localhost:5000/api/produccion/${id}`, { headers });
                const produccionData = produccionResponse.data;

                // Establecer los valores iniciales del formulario
                setOti(produccionData.oti?.numeroOti || '');
                setFecha(produccionData.fecha || '');
                setProceso(produccionData.proceso?.nombre || '');
                setAreaProduccion(produccionData.areaProduccion?.nombre || '');
                setMaquina(produccionData.maquina?.nombre || '');
                setTiempoPreparacion(produccionData.tiempoPreparacion || '');
                setTiempoOperacion(produccionData.tiempoOperacion || '');


                // Obtener las listas de OTIs, procesos, áreas de producción y máquinas
                const [otisRes, procesosRes, areasRes, maquinasRes] = await Promise.all([
                    axiosInstance.get('http://localhost:5000/api/produccion/otis', { headers }),
                    axiosInstance.get('http://localhost:5000/api/produccion/procesos', { headers }),
                    axiosInstance.get('http://localhost:5000/api/produccion/areas-produccion', { headers }),
                    axiosInstance.get('http://localhost:5000/api/produccion/maquinas', { headers }),
                ]);

                setOtis(otisRes.data);
                setProcesos(procesosRes.data);
                setAreasProduccion(areasRes.data);
                setMaquinas(maquinasRes.data);
            } catch (error) {
                console.error('Error al cargar los datos:', error);
                toast.error('Hubo un problema al cargar los datos.');
            }
        };

        fetchData();
    }, [id]);

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Verificar si cada valor existe en la BD o crearlo si es nuevo
            let otiId = otis.find((o) => o.numeroOti.trim().toLowerCase() === oti.trim().toLowerCase())?._id;
            if (!otiId) {
                const nuevaOti = await axios.post(
                    'http://localhost:5000/api/produccion/otis',
                    { numeroOti: oti.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                otiId = nuevaOti.data._id;
            }

            let procesoId = procesos.find((p) => p.nombre.trim().toLowerCase() === proceso.trim().toLowerCase())?._id;
            if (!procesoId) {
                const nuevoProceso = await axios.post(
                    'http://localhost:5000/api/produccion/procesos',
                    { nombre: proceso.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                procesoId = nuevoProceso.data._id;
            }

            let areaProduccionId = areasProduccion.find(
                (a) => a.nombre.trim().toLowerCase() === areaProduccion.trim().toLowerCase()
            )?._id;
            if (!areaProduccionId) {
                const nuevaArea = await axios.post(
                    'http://localhost:5000/api/produccion/areas-produccion',
                    { nombre: areaProduccion.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                areaProuccionId = nuevaArea.data._id;
            }

            let maquinaId = maquinas.find((m) => m.nombre.trim().toLowerCase() === maquina.trim().toLowerCase())?._id;
            if (!maquinaId) {
                const nuevaMaquina = await axios.post(
                    'http://localhost:5000/api/produccion/maquinas',
                    { nombre: maquina.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                maquinaId = nuevaMaquina.data._id;
            }

            // Ajustar la fecha para incluir la zona horaria local
            const fechaLocal = new Date(fecha);
            fechaLocal.setMinutes(fechaLocal.getMinutes() + fechaLocal.getTimezoneOffset());

            // Actualizar la producción con los IDs obtenidos o creados
            await axios.put(
                `http://localhost:5000/api/produccion/${id}`,
                {
                    oti: otiId,
                    fecha: fechaLocal.toISOString(),
                    proceso: procesoId,
                    areaProduccion: areaProduccionId,
                    maquina: maquinaId,
                    tiempoPreparacion,
                    tiempoOperacion,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Producción actualizada exitosamente.');
            navigate('/operario-dashboard'); // Redirigir al dashboard después de editar
        } catch (error) {
            console.error('Error al actualizar la producción:', error);
            toast.error('Hubo un problema al actualizar la producción.');
        }
    };

    return (
        <div>
            <h2>Editar Producción</h2>
            <form onSubmit={handleSubmit}>
                {/* Campo OTI */}
                <div>
                    <label>OTI:</label>
                    <input
                        list="oti-list"
                        value={oti}
                        onChange={(e) => setOti(e.target.value)}
                        required
                    />
                    <datalist id="oti-list">
                        {otis.map((o) => (
                            <option key={o._id} value={o.numeroO} />
                        ))}
                    </datalist>
                </div>

                {/* Campo Fecha */}
                <div>
                    <label>Fecha:</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                    />
                </div>

                {/* Campo Proceso */}
                <div>
                    <label>Proceso:</label>
                    <input
                        list="procesos-list"
                        value={proceso}
                        onChange={(e) => setProceso(e.target.value)}
                        required
                    />
                    <datalist id="procesos-list">
                        {procesos.map((p) => (
                            <option key={p._id} value={p.nombre} />
                        ))}
                    </datalist>
                </div>

                {/* Campo Área de Producción */}
                <div>
                    <label>Área de Producción:</label>
                    <input
                        list="area-list"
                        value={areaProduccion}
                        onChange={(e) => setAreaProduccion(e.target.value)}
                        required
                    />
                    <datalist id="area-list">
                        {areasProduccion.map((a) => (
                            <option key={a._id} value={a.nombre} />
                        ))}
                    </datalist>
                </div>

                {/* Campo Máquina */}
                <div>
                    <label>Máquina:</label>
                    <input
                        list="maquina-list"
                        value={maquina}
                        onChange={(e) => setMaquina(e.target.value)}
                        required
                    />
                    <datalist id="maquina-list">
                        {maquinas.map((m) => (
                            <option key={m._id} value={m.nombre} />
                        ))}
                    </datalist>
                </div>

                {/* Campo Tiempo de Preparación */}
                <div>
                    <label>Tiempo de Preparación (min):</label>
                    <input
                        type="number"
                        min="0"
                        value={tiempoPreparacion}
                        onChange={(e) => setTiempoPreparacion(e.target.value)}
                        required
                    />
                </div>

                {/* Campo Tiempo de Operación */}
                <div>
                    <label>Tiempo de Operación (min):</label>
                    <input
                        type="number"
                        min="0"
                        value={tiempoOperacion}
                        onChange={(e) => setTiempoOperacion(e.target.value)}
                        required
                    />
                </div>
                {/* Botón de Envío */}
                <button type="submit">Guardar Cambios</button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default EditarProduccion;