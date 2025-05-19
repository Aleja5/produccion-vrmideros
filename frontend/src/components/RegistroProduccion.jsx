import { Sidebar } from "../components/Sidebar";
import { Input, Textarea, Button } from "../components/ui/index";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";


export default function RegistroProduccion() {  
      
    const { jornadaId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [nombreOperario, setNombreOperario] = useState("");
    const [jornadaData, setJornadaData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: "",
        horaFin: "",
        operario: ""
    });
    // Lista de actividades nuevas a agregar (en el formulario)
    const [actividades, setActividades] = useState([
        {
            oti: "",
            proceso: "",
            areaProduccion: "",
            maquina: "",
            insumos: "",
            tipoTiempo: "",
            horaInicio: "",
            horaFin: "",
            tiempo: 0,
            observaciones: ""
        }
    ]);
    // Lista de actividades ya existentes en la jornada (si aplica)
    const [actividadesExistentes, setActividadesExistentes] = useState([]);
    const [maquinasData, setMaquinasData] = useState([]);
    const [areasProduccionData, setAreasProduccionData] = useState([]);
    const [procesosData, setProcesosData] = useState([]);
    const [insumosData, setInsumosData] = useState([]);

    useEffect(() => {
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
            if (operarioData?._id || operarioData?.id) {
            setJornadaData(prev => ({ ...prev, operario: operarioData._id || operarioData.id }));
            }
        } catch (error) {
            console.error("Error al leer datos del operario:", error);
        }

        // Cargar datos de selectores
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

        // Cargar jornada si hay jornadaId
        if (jornadaId) {
            try {
            const res = await fetch(`http://localhost:5000/api/jornadas/${jornadaId}`);
            if (res.ok) {
                const jornada = await res.json();

                // Normalizar actividades existentes
                if (Array.isArray(jornada.registros)) {
                const actividadesNorm = jornada.registros.map(act => ({
                    ...act,
                    horaInicio: act.horaInicio
                    ? new Date(act.horaInicio).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        })
                    : "",
                    horaFin: act.horaFin
                    ? new Date(act.horaFin).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        })
                    : "",
                    tiempo: act.tiempo || 0,
                }));

                setActividadesExistentes(actividadesNorm);
                }

                // Establecer fecha de la jornada
                if (jornada.fecha) {
                let fechaStr = jornada.fecha;
                if (typeof fechaStr === "string" && fechaStr.length > 10) {
                    fechaStr = fechaStr.substring(0, 10); // ISO -> YYYY-MM-DD
                }
                setJornadaData(prev => ({ ...prev, fecha: fechaStr }));
                } else {
                setJornadaData(prev => ({
                    ...prev,
                    fecha: new Date().toISOString().split("T")[0],
                }));
                }
            }
            } catch (error) {
            console.error("Error al cargar actividades de la jornada:", error);
            }
        }
        };

        loadInitialData();
        }, [navigate, jornadaId]);


    // Calcular horaInicio y horaFin de la jornada considerando todas las actividades (existentes + nuevas)
    useEffect(() => {
        // Unir actividades existentes y nuevas
        const todas = [...actividadesExistentes, ...actividades];
        const horasInicio = todas.map(a => a.horaInicio).filter(Boolean);
        const horasFin = todas.map(a => a.horaFin).filter(Boolean);
        let primeraHora = "";
        let ultimaHora = "";
        if (horasInicio.length > 0) {
            primeraHora = horasInicio.sort()[0];
        }
        if (horasFin.length > 0) {
            ultimaHora = horasFin.sort()[horasFin.length - 1];
        }
        setJornadaData(prev => ({
            ...prev,
            horaInicio: primeraHora,
            horaFin: ultimaHora
        }));
    }, [actividades, actividadesExistentes]);


    const handleJornadaChange = (e) => {
        const { name, value } = e.target;
        setJornadaData(prev => ({ ...prev, [name]: value }));
    };

    const handleActividadChange = (index, e) => {

        const { name, value } = e.target;
        const nuevasActividades = [...actividades];
        nuevasActividades[index][name] = value;


        // Calcular tiempos de inicio y fin
        if (name === 'horaInicio' || name === 'horaFin') {
            const inicio = nuevasActividades[index].horaInicio;
            const fin = nuevasActividades[index].horaFin;

            if (inicio && fin) {
                const inicioDate = new Date(`1970-01-01T${inicio}:00`);
                const finDate = new Date(`1970-01-01T${fin}:00`);

                if (finDate > inicioDate) {
                    const diffMs = finDate - inicioDate;
                    nuevasActividades[index].tiempo = Math.floor(diffMs / 60000); // Convertir a minutos
                } else {
                    nuevasActividades[index].tiempo = 0;
                }
            }
        }setActividades(nuevasActividades);
    };

    const agregarActividad = () => {
        setActividades(prev => [...prev, {
            oti: "",
            proceso: "",
            areaProduccion: "",
            maquina: "",
            insumos: "",
            tipoTiempo: "",
            horaInicio: "",
            horaFin: "",
            tiempo: "",
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
        console.log("Fecha recibida en combinarFechaYHora:", fecha);
        console.log("Hora recibida en combinarFechaYHora:", hora);
        if (!hora || typeof hora !== 'string' || !hora.match(/^\d{2}:\d{2}$/)) return null;

        const [hh, mm] = hora.split(":");
        const [yyyy, mmFecha, dd] = fecha.split('-'); // Separar año, mes y día

        // IMPORTANTE: El mes en JavaScript es 0-indexado (0 para enero, 11 para diciembre)
        const date = new Date(Number(yyyy), Number(mmFecha) - 1, Number(dd), Number(hh), Number(mm), 0);
        console.log("Fecha combinada:", date);

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
            fecha: jornadaData.fecha,
            horaInicio: combinarFechaYHora(jornadaData.fecha, jornadaData.horaInicio),
            horaFin: combinarFechaYHora(jornadaData.fecha, jornadaData.horaFin),
            actividades: actividades.map(actividad => ({
                ...actividad,
                tipoTiempo: actividad.tipoTiempo,
                horaInicio: actividad.horaInicio && actividad.horaInicio !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaInicio) : null,
                horaFin: actividad.horaFin && actividad.horaFin !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaFin) : null,
                tiempo: actividad.tiempo || 0,}))
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

        const actividad = actividades[0]; 

        if (!actividad.horaInicio || !actividad.horaFin || !actividad.tipoTiempo || !actividad.oti) {
        toast.error("Completa hora de inicio, fin, tipo de tiempo y OTI.");
        setLoading(false);
        return;
    }

        const horaInicio = combinarFechaYHora(jornadaData.fecha, actividad.horaInicio);
        const horaFin = combinarFechaYHora(jornadaData.fecha, actividad.horaFin);

        if (!horaInicio || !horaFin) {
            toast.error("Formato de hora incorrecto.");
            setLoading(false);
            return;
        }

        const actividadToSend = {
            ...actividad,
            horaInicio,
            horaFin,
            tiempo: actividad.tiempo || 0,
            operario: jornadaData.operario,
        };
        console.log("Datos a enviar:", actividadToSend);

        try {
            let response, result;
            if (jornadaId) {
                // Agregar actividad a jornada existente
                response = await fetch(`http://localhost:5000/api/jornadas/${jornadaId}/actividades`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(actividadToSend)
                });            
            } else {                
                response = await fetch("http://localhost:5000/api/produccion/registrar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...actividadToSend,
                        fecha: jornadaData.fecha,
                })
            });
            }
                result = await response.json();

            if (!response.ok) {
                toast.error(`Error al guardar la actividad: ${result.msg || result.error || "Error inesperado"}`);
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

                                
                                <div className="col-span-3 md:col-span-3 grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Tipo de Tiempo:</label>
                                        <Input as="select" name="tipoTiempo" value={actividad.tipoTiempo} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                            <option className="text-gray-400" value="">Seleccionar Tipo de Tiempo</option>
                                            <option value="Preparación">Preparación</option>
                                            <option value="Operación">Operación</option>
                                            <option value="Alimentacion">Alimentación</option>
                                        </Input>
                                    </div>
                                    <div>
                                        <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700">Hora Inicio</label>
                                        <input type="time" name="horaInicio" value={actividad.horaInicio || ''} onChange={(e) => handleActividadChange(index, e)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700">Hora Fin</label>
                                        <input type="time" name="horaFin" value={actividad.horaFin || ''} onChange={(e) => handleActividadChange(index, e)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Tiempo:</label>
                                        <Input
                                            type="number"
                                            name="tiempo"
                                            value={(() => {
                                                const inicio = actividad.horaInicio;
                                                const fin = actividad.horaFin;
                                                if (inicio && fin) {
                                                    const inicioDate = new Date(`1970-01-01T${inicio}:00`);
                                                    const finDate = new Date(`1970-01-01T${fin}:00`);
                                                    if (finDate > inicioDate) {
                                                        return Math.floor((finDate - inicioDate) / 60000);
                                                    }
                                                }
                                                return 0;
                                            })()}
                                            readOnly
                                            disabled
                                            className="w-full bg-gray-100 cursor-not-allowed"
                                        />
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
                </div>
            </div>
        </div>
    );
}