import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Input, Textarea, Button } from "../components/ui/index";
import { Sidebar } from "../components/Sidebar";

export default function RegistroProduccion() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [nombreOperario, setNombreOperario] = useState("");
    const [jornadaData, setJornadaData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: "",
        horaFin: "",
        operario: ""
    });
    const [actividades, setActividades] = useState([
        {
            oti: "",
            proceso: "",
            areaProduccion: "",
            maquina: "",
            insumos: "",
            tiempoPreparacion: "",
            tiempoOperacion: "",
            horaInicioPreparacion: "",
            horaFinPreparacion: "",
            horaInicioOperacion: "",
            horaFinOperacion: "",
            observaciones: ""
        }
    ]);
    const [maquinasData, setMaquinasData] = useState([]);
    const [areasProduccionData, setAreasProduccionData] = useState([]);
    const [procesosData, setProcesosData] = useState([]);
    const [insumosData, setInsumosData] = useState([]);

    useEffect(() => {
        // Lógica para verificar el operario y cargar los datos de los selectores
        const loadInitialData = async () => {
            const operario = localStorage.getItem("operario");
            if (!operario) {
                toast.error("No tienes acceso. Valida cédula.");
                navigate("/validate-cedula");
                return;
            }
            try {
                const operarioData = JSON.parse(operario);
                if (operarioData?.name) setNombreOperario(operarioData.name);
                if (operarioData?._id || operarioData?.id) setJornadaData(prev => ({ ...prev, operario: operarioData._id || operarioData.id }));
            } catch (error) {
                console.error("Error al leer datos del operario:", error);
            }

            try {
                const maquinasRes = await fetch("http://localhost:5000/api/produccion/maquinas");
                if (maquinasRes.ok) setMaquinasData(await maquinasRes.json());
                const areasRes = await fetch("http://localhost:5000/api/produccion/areas");
                if (areasRes.ok) setAreasProduccionData(await areasRes.json());
                const procesosRes = await fetch("http://localhost:5000/api/produccion/procesos");
                if (procesosRes.ok) setProcesosData(await procesosRes.json());
                const insumosRes = await fetch("http://localhost:5000/api/produccion/insumos");
                if (insumosRes.ok) setInsumosData(await insumosRes.json());
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };

        loadInitialData();
    }, [navigate]);

    useEffect(() => {
    const todasLasHoras = [];

    actividades.forEach((actividad) => {
        if (actividad.horaInicioPreparacion) todasLasHoras.push(actividad.horaInicioPreparacion);
        if (actividad.horaInicioOperacion) todasLasHoras.push(actividad.horaInicioOperacion);
        if (actividad.horaFinPreparacion) todasLasHoras.push(actividad.horaFinPreparacion);
        if (actividad.horaFinOperacion) todasLasHoras.push(actividad.horaFinOperacion);
    });

    if (todasLasHoras.length > 0) {
        const horasOrdenadas = [...todasLasHoras].sort();
        const primeraHora = horasOrdenadas[0];
        const ultimaHora = horasOrdenadas[horasOrdenadas.length - 1];

        setJornadaData(prev => ({
            ...prev,
            horaInicio: primeraHora,
            horaFin: ultimaHora
        }));
    } else {
        // Opcional: limpiar si no hay actividades
        setJornadaData(prev => ({
            ...prev,
            horaInicio: "",
            horaFin: ""
        }));
    }
}, [actividades]);


    const handleJornadaChange = (e) => {
        const { name, value } = e.target;
        setJornadaData(prev => ({ ...prev, [name]: value }));
    };

    const handleActividadChange = (index, e) => {

        const { name, value } = e.target;
        const nuevasActividades = [...actividades];
        nuevasActividades[index][name] = value;

        // Calcular tiempos de preparación y operación si se ingresan horas de inicio y fin
        if (name === 'horaInicioPreparacion' || name === 'horaFinPreparacion') {
            const inicio = nuevasActividades[index].horaInicioPreparacion;
            const fin = nuevasActividades[index].horaFinPreparacion;

            if (inicio && fin) {
                const inicioDate = new Date(`1970-01-01T${inicio}:00`);
                const finDate = new Date(`1970-01-01T${fin}:00`);

                if (finDate > inicioDate) {
                    const diffMs = finDate - inicioDate;
                    nuevasActividades[index].tiempoPreparacion = Math.floor(diffMs / 60000); // Convertir a minutos
                } else {
                    nuevasActividades[index].tiempoPreparacion = 0;
                }
            }
        }

        if (name === 'horaInicioOperacion' || name === 'horaFinOperacion') {
            const inicio = nuevasActividades[index].horaInicioOperacion;
            const fin = nuevasActividades[index].horaFinOperacion;

            if (inicio && fin) {
                const inicioDate = new Date(`1970-01-01T${inicio}:00`);
                const finDate = new Date(`1970-01-01T${fin}:00`);

                if (finDate > inicioDate) {
                    const diffMs = finDate - inicioDate;
                    nuevasActividades[index].tiempoOperacion = Math.floor(diffMs / 60000); // Convertir a minutos
                } else {
                    nuevasActividades[index].tiempoOperacion = 0;
                }
            }
        }

        setActividades(nuevasActividades);
    };

    const agregarActividad = () => {
        setActividades(prev => [...prev, {
            oti: "",
            proceso: "",
            areaProduccion: "",
            maquina: "",
            insumos: "",
            tiempoPreparacion: "",
            tiempoOperacion: "",
            horaInicioPreparacion: "",
            horaFinPreparacion: "",
            horaInicioOperacion: "",
            horaFinOperacion: "",
            observaciones: ""
        }]);
    };

    const eliminarActividad = (index) => {
        const nuevasActividades = [...actividades];
        nuevasActividades.splice(index, 1);
        setActividades(nuevasActividades);
    };
    
    // Combinar fecha con hora para crear una fecha completa válida
    const combinarFechaYHora = (fecha, hora) => {
        if (!hora || typeof hora !== 'string' || !hora.match(/^\d{2}:\d{2}$/)) return null;

        const [hh, mm] = hora.split(":");
        const date = new Date(fecha);
        date.setHours(Number(hh), Number(mm), 0);

        return isNaN(date.getTime()) ? null : date;
    };

    const handleSubmitJornada = async (e) => {
        e.preventDefault();

        if (!jornadaData.horaInicio || !jornadaData.horaFin) {
            toast.error("Horas de inicio o fin de jornada vacías.");
            return;
        }

        console.log("Actividades al enviar jornada:", actividades); // DEBUG: Verificar campos de hora

        setLoading(true);

        const dataToSend = {
            ...jornadaData,
            horaInicio: combinarFechaYHora(jornadaData.fecha, jornadaData.horaInicio),
            horaFin: combinarFechaYHora(jornadaData.fecha, jornadaData.horaFin),
            actividades: actividades.map(actividad => ({
                ...actividad,
                tiempoPreparacion: Number(actividad.tiempoPreparacion) || 0,
                tiempoOperacion: Number(actividad.tiempoOperacion) || 0,
                horaInicioPreparacion: actividad.horaInicioPreparacion && actividad.horaInicioPreparacion !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaInicioPreparacion) : null,
                horaFinPreparacion: actividad.horaFinPreparacion && actividad.horaFinPreparacion !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaFinPreparacion) : null,
                horaInicioOperacion: actividad.horaInicioOperacion && actividad.horaInicioOperacion !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaInicioOperacion) : null,
                horaFinOperacion: actividad.horaFinOperacion && actividad.horaFinOperacion !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaFinOperacion) : null
            }))
        };

        console.log("Payload enviado:", dataToSend); // DEBUG: Verificar que los campos de hora estén en el payload

        try {
            const response = await fetch("http://localhost:5000/api/jornadas/completa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(`Error al guardar la jornada: ${result.msg || "Error inesperado"}`);
                return;
            }

            toast.success("Jornada guardada exitosamente");
            navigate("/operario-dashboard");
        } catch (error) {
            console.error("Error al enviar la jornada:", error);
            toast.error("Error al guardar la jornada");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitActividad = async (e) => {
        e.preventDefault();
        setLoading(true);

        const actividad = actividades[0]; // Suponiendo que se registra una actividad a la vez
        const dataToSend = {
            ...actividad,
            operario: jornadaData.operario,
            fecha: jornadaData.fecha
        };

        try {
            const response = await fetch("http://localhost:5000/api/produccion/registrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(`Error al guardar la actividad: ${result.msg || "Error inesperado"}`);
                return;
            }

            toast.success("Actividad guardada exitosamente");
            navigate("/operario-dashboard");
        } catch (error) {
            console.error("Error al enviar la actividad:", error);
            toast.error("Error al guardar la actividad");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex justify-center items-start py-10 px-6 overflow-y-auto">
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Registro de Producción</h1>

                    <form onSubmit={handleSubmitJornada} className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Operario:</label>
                                <Input type="text" value={nombreOperario || "Cargando..."} disabled className="w-full" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Fecha de la Jornada:</label>
                                <Input type="date" name="fecha" value={jornadaData.fecha} onChange={handleJornadaChange} required className="w-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Hora de Inicio de la jornada:</label>
                                <Input type="time" name="horaInicio" value={jornadaData.horaInicio} readOnly className="w-full bg-gray-100 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Hora de Fin de la jornada:</label>
                                <Input type="time" name="horaFin" value={jornadaData.horaFin} readOnly className="w-full bg-gray-100 cursor-not-allowed" />
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-800">Actividades de la Jornada</h2>
                        {actividades.map((actividad, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                                <h3 className="col-span-2 text-md font-medium text-gray-700">Actividad #{index + 1}</h3>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">OTI:</label>
                                    <Input type="text" name="oti" value={actividad.oti} onChange={(e) => handleActividadChange(index, e)} placeholder="OTI" required className="w-full" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Área de Producción:</label>
                                    <Input as="select" name="areaProduccion" value={actividad.areaProduccion} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                        <option className="text-gray-400" value="">Seleccionar Área</option>
                                        {areasProduccionData.map(area => <option key={area._id} value={area._id}>{area.nombre}</option>)}
                                    </Input>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Proceso:</label>
                                    <Input as="select" name="proceso" value={actividad.proceso} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                        <option className="text-gray-400" value="">Seleccionar Proceso</option>
                                        {procesosData.map(proceso => <option key={proceso._id} value={proceso._id}>{proceso.nombre}</option>)}
                                    </Input>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Máquina:</label>
                                    <Input as="select" name="maquina" value={actividad.maquina} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                        <option className="text-gray-400" value="">Seleccionar Máquina</option>
                                        {maquinasData.map(maquina => <option key={maquina._id} value={maquina._id}>{maquina.nombre}</option>)}
                                    </Input>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Insumos:</label>
                                    <Input as="select" name="insumos" value={actividad.insumos} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                        <option className="text-gray-400" value="">Seleccionar Insumo</option>
                                        {insumosData.map(insumo => <option key={insumo._id} value={insumo._id}>{insumo.nombre}</option>)}
                                    </Input>
                                </div>

                                {/* Tiempos de Preparación */}
                                <div className="col-span-3 md:col-span-3 grid grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="horaInicioPreparacion" className="block text-sm font-medium text-gray-700">Hora Inicio (Preparación)</label>
                                        <input type="time" name="horaInicioPreparacion" value={actividad.horaInicioPreparacion || ''} onChange={(e) => handleActividadChange(index, e)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="horaFinPreparacion" className="block text-sm font-medium text-gray-700">Hora Fin (Preparación)</label>
                                        <input type="time" name="horaFinPreparacion" value={actividad.horaFinPreparacion || ''} onChange={(e) => handleActividadChange(index, e)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Tiempo Preparación (min):</label>
                                        <Input type="number" name="tiempoPreparacion" value={actividad.tiempoPreparacion} onChange={(e) => handleActividadChange(index, e)} className="w-full" />
                                        <span className="block text-gray-500 text-sm italic">Tiempo dedicado a alistar equipos, materiales, etc., antes de la operación principal.</span>
                                    </div>
                                </div>

                                {/* Tiempos de Operación */}
                                <div className="col-span-3 md:col-span-3 grid grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="horaInicioOperacion" className="block text-sm font-medium text-gray-700">Hora Inicio (Operación)</label>
                                        <input type="time" name="horaInicioOperacion" value={actividad.horaInicioOperacion || ''} onChange={(e) => handleActividadChange(index, e)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="horaFinOperacion" className="block text-sm font-medium text-gray-700">Hora Fin (Operación)</label>
                                        <input type="time" name="horaFinOperacion" value={actividad.horaFinOperacion || ''} onChange={(e) => handleActividadChange(index, e)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Tiempo Operación (min):</label>
                                        <Input type="number" name="tiempoOperacion" value={actividad.tiempoOperacion} onChange={(e) => handleActividadChange(index, e)} className="w-full" />
                                        <span className="block text-gray-500 text-sm italic">Tiempo dedicado a la ejecución directa de la tarea productiva.</span>
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <div className="col-span-3">
                                    <label className="block text-gray-700 font-medium mb-1">Observaciones de la Actividad:</label>
                                    <Textarea name="observaciones" value={actividad.observaciones} onChange={(e) => handleActividadChange(index, e)} placeholder="Observaciones de la actividad" className="w-full" />
                                </div>

                                {/* Botón de Eliminar */}
                                {actividades.length > 1 && (
                                    <div className="col-span-3 flex justify-end">
                                        <Button type="button" variant="secondary" onClick={() => eliminarActividad(index)}>Eliminar Actividad</Button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-between items-center mt-4">
                            <Button type="button" onClick={handleSubmitActividad}>Guardar Actividad</Button>
                            <Button type="button" onClick={agregarActividad}>Agregar Nueva Actividad</Button>
                            <div>
                                <Button variant="ghost" onClick={() => navigate('/operario-dashboard')}>Atrás</Button>
                                <Button type="submit" disabled={loading} className="ml-3">
                                    {loading ? "Guardando..." : "Guardar Jornada Completa"}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* <ToastContainer /> Ya deberías tenerlo en tu layout principal */}
                </div>
            </div>
        </div>
    );
}