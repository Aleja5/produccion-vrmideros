import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Sidebar } from "../components/Sidebar";
import { Input, Textarea, Button, Card } from "../components/ui/index";
import Navbar from "./Navbar";
import Select from 'react-select';

export default function RegistroProduccion() {
    const { jornadaId: urlJornadaId } = useParams(); // Renombrar para evitar conflicto con el estado local
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [nombreOperario, setNombreOperario] = useState("");
    const [JornadaActualId, setJornadaActualId] = useState(urlJornadaId); // Nuevo estado para el ID de la jornada
    const [jornadaData, setJornadaData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: "",
        horaFin: "",
        operario: ""
    });
    const [actividades, setActividades] = useState([
        {
            oti: "",
            procesos: [],
            areaProduccion: "",
            maquina: "",
            insumos: [],
            tipoTiempo: "",
            horaInicio: "",
            horaFin: "",
            tiempo: 0,
            observaciones: "",
            availableProcesos: []
        }
    ]);
    const [actividadesExistentes, setActividadesExistentes] = useState([]);
    const [maquinasData, setMaquinasData] = useState([]);
    const [areasProduccionData, setAreasProduccionData] = useState([]);
    const [insumosData, setInsumosData] = useState([]);

    const resetFormForNewJornada = () => {
        setJornadaData(prev => ({
            ...prev, // Keeps operario ID
            fecha: new Date().toISOString().split('T')[0], // Reset fecha to today
            horaInicio: "",
            horaFin: "",
        }));
        setActividades([
            {
                oti: "",
                procesos: [],
                areaProduccion: "",
                maquina: "",
                insumos: [],
                tipoTiempo: "",
                horaInicio: "",
                horaFin: "",
                tiempo: 0,
                observaciones: "",
                availableProcesos: []
            }
        ]);
        setActividadesExistentes([]); // Clear any activities that might have been loaded if editing
        // The useEffect for fetchActividadesResumen will re-run due to jornadaData.fecha changing
        // and should show the summary for the new date, including the one just saved.
    };

    const addActividad = () => {
        setActividades(prev => [...prev, {
            oti: "",
            procesos: [],
            areaProduccion: "",
            maquina: "",
            insumos: [],
            tipoTiempo: "",
            horaInicio: "",
            horaFin: "",
            tiempo: 0,
            observaciones: "",
            availableProcesos: []
        }]);
    };

    // Función para eliminar una actividad
    const removeActividad = (index) => {
        if (actividades.length > 1) {
            setActividades(prev => prev.filter((_, i) => i !== index));
        } else {
            toast.warn("Debe haber al menos una actividad.");
        }
    };

    const [actividadesResumen, setActividadesResumen] = useState([]);
    const [loadingResumen, setLoadingResumen] = useState(false);

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

                const insumosRes = await fetch("http://localhost:5000/api/produccion/insumos");
                if (insumosRes.ok) setInsumosData(await insumosRes.json());
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }

            // Lógica principal para obtener o crear la jornada
            if (urlJornadaId) {
                // Si hay un ID en la URL, cargar esa jornada específica
                try {
                    const res = await fetch(`http://localhost:5000/api/jornadas/${urlJornadaId}`);
                    if (res.ok) {
                        const jornada = await res.json();
                        setJornadaActualId(jornada._id); // Asegura que el estado local tenga el ID

                        // Normalizar actividades existentes
                        if (Array.isArray(jornada.registros)) {
                            const actividadesNorm = jornada.registros.map(act => ({
                                ...act,
                                horaInicio: act.horaInicio
                                    ? new Date(act.horaInicio).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                                    : "",
                                horaFin: act.horaFin
                                    ? new Date(act.horaFin).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                                    : "",
                                tiempo: act.tiempo || 0,
                                // Asegúrate de que availableProcesos se cargue si el área está seleccionada
                                availableProcesos: Array.isArray(act.procesosInfo) ? act.procesosInfo : [], // Suponiendo que el backend puede enviar info de procesos
                            }));
                            setActividadesExistentes(actividadesNorm);
                            // Si estamos editando, las actividades iniciales del formulario deben ser las existentes
                            setActividades(actividadesNorm.length > 0 ? actividadesNorm : [{
                                oti: "",
                                procesos: [],
                                areaProduccion: "",
                                maquina: "",
                                insumos: [],
                                tipoTiempo: "",
                                horaInicio: "",
                                horaFin: "",
                                tiempo: 0,
                                observaciones: "",
                                availableProcesos: []
                            }]);

                            // Para cada actividad existente, cargar los procesos disponibles si el área está seleccionada
                            actividadesNorm.forEach((act, index) => {
                                if (act.areaProduccion) {
                                    fetchProcesosForActivity(index, act.areaProduccion);
                                }
                            });
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
    }, [navigate, urlJornadaId]); // Corregido: usar urlJornadaId

    // useEffect para cargar actividades existentes al editar una jornada
    useEffect(() => {
        const fetchActividadesResumen = async () => {
            // Solo cargar resumen si NO estamos editando una jornada específica y tenemos fecha y operario
            if (jornadaData.fecha && jornadaData.operario && !urlJornadaId) { // Corregido: usar urlJornadaId
                setLoadingResumen(true);
                try {
                    const response = await fetch(`http://localhost:5000/api/jornadas/operario/${jornadaData.operario}?fecha=${jornadaData.fecha}`);
                    if (!response.ok) {
                        if (response.status === 404) {
                            // console.warn("Resumen: Jornadas no encontradas para el operario/fecha."); // Optional log
                            setActividadesResumen([]);
                        } else {
                            // console.error(`Resumen: Error ${response.status} al cargar jornadas.`); // Optional log
                            toast.error("Error al cargar resumen de actividades.");
                            setActividadesResumen([]);
                        }
                    } else {
                        const jornadasDelDia = await response.json();
                        console.log("Fetched jornadasDelDia:", jornadasDelDia);
                        if (jornadasDelDia && jornadasDelDia.length > 0) {
                            let todasLasActividadesDelDia = jornadasDelDia.reduce((acc, jornada) => {
                                const actividadesDeJornada = jornada.registros || [];
                                return acc.concat(actividadesDeJornada.map(act => ({
                                    ...act,
                                    fechaJornada: jornada.fecha,
                                    // Incluir el número de OTI si está disponible
                                    otiNumero: act.oti?.numeroOti || "N/A",
                                    // Asegurarse de que el proceso tenga nombre para mostrar
                                    procesosNombres: Array.isArray(act.procesos) ? act.procesos.map(p => p.nombre).join(', ') : "N/A"
                                })));
                            }, []);

                            // Sort activities by horaInicio
                            todasLasActividadesDelDia.sort((a, b) => {
                                const dateA = new Date(a.horaInicio);
                                const dateB = new Date(b.horaInicio);
                                return dateA - dateB;
                            });

                            console.log("Processed and sorted todasLasActividadesDelDia:", todasLasActividadesDelDia);
                            setActividadesResumen(todasLasActividadesDelDia);
                        } else {
                            setActividadesResumen([]);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching activities summary:", error);
                    toast.error("No se pudo cargar el resumen de actividades.");
                    setActividadesResumen([]);
                } finally {
                    setLoadingResumen(false);
                }
            } else {
                setActividadesResumen([]);
            }
        };

        fetchActividadesResumen();
    }, [jornadaData.fecha, jornadaData.operario, urlJornadaId]); // Corregido: usar urlJornadaId

    // useEffect para depurar actividadesResumen
    useEffect(() => {
        console.log("actividadesResumen state updated:", actividadesResumen);
    }, [actividadesResumen]);

    // Calcular horaInicio y horaFin de la jornada considerando todas las actividades (existentes + nuevas)
    useEffect(() => {
        // Unir actividades existentes y nuevas
        const todas = [...actividadesExistentes, ...actividades];
        const horasInicio = todas.map(a => a.horaInicio).filter(Boolean);
        const horasFin = todas.map(a => a.horaFin).filter(Boolean);
        let primeraHora = "";
        let ultimaHora = "";

        // Función para parsear y comparar horas en formato "HH:MM"
        const parseTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes; // Convertir a minutos para fácil comparación
        };

        if (horasInicio.length > 0) {
            // Ordenar horas de inicio y tomar la más temprana
            primeraHora = horasInicio.sort((a, b) => parseTime(a) - parseTime(b))[0];
        }
        if (horasFin.length > 0) {
            // Ordenar horas de fin y tomar la más tardía
            ultimaHora = horasFin.sort((a, b) => parseTime(a) - parseTime(b))[horasFin.length - 1];
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

    const fetchProcesosForActivity = useCallback(async (activityIndex, areaId) => {
        if (!areaId) {
            setActividades(prev =>
                prev.map((act, idx) =>
                    idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
                )
            );
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/procesos?areaId=${areaId}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`[Proceso Fetch Debug] API response for areaId ${areaId} (Activity ${activityIndex}):`, JSON.stringify(data, null, 2));

                let determinedProcesos = [];
                if (Array.isArray(data)) {
                    determinedProcesos = data;
                } else if (data && Array.isArray(data.procesos)) {
                    determinedProcesos = data.procesos;
                    console.log(`[Proceso Fetch Debug] Interpreted API data as an object with 'procesos' array. Count: ${determinedProcesos.length}`);
                } else {
                    console.warn(`[Proceso Fetch Debug] API data for areaId ${areaId} does not match expected structures (direct array or object with 'procesos' array). Data:`, data);
                    determinedProcesos = [];
                }

                setActividades(prev =>
                    prev.map((act, idx) => {
                        if (idx === activityIndex) {
                            console.log(`[Proceso Fetch Debug] Updating activity ${idx} with ${determinedProcesos.length} availableProcesos for areaId ${areaId}.`);
                            return { ...act, availableProcesos: determinedProcesos, procesos: [] }; // Reset procesos
                        }
                        return act;
                    })
                );
            } else {
                console.error(`[Proceso Fetch Debug] Error fetching procesos for area ${areaId}. Status: ${response.status}`);
                toast.error("Error al cargar procesos para el área seleccionada.");
                setActividades(prev =>
                    prev.map((act, idx) =>
                        idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
                    )
                );
            }
        } catch (error) {
            console.error("[Proceso Fetch Debug] Exception fetching procesos for activity:", error);
            toast.error("No se pudieron cargar los procesos (exception).");
            setActividades(prev =>
                prev.map((act, idx) =>
                    idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
                )
            );
        }
    }, []); // Dependencias vacías para useCallback

    const handleActividadChange = (index, e_or_selectedOptions, actionMeta) => {
        let name, value;

        // Check if the event is from react-select or a standard input
        if (actionMeta && actionMeta.name) { // Event from react-select
            name = actionMeta.name;
            value = e_or_selectedOptions ? e_or_selectedOptions.map(option => option.value) : [];
        } else { // Event from standard input
            name = e_or_selectedOptions.target.name;
            value = e_or_selectedOptions.target.value;
        }

        const nuevasActividades = actividades.map((act, idx) => {
            if (idx === index) {
                let updatedAct = { ...act };

                if (name === 'areaProduccion') {
                    updatedAct.areaProduccion = value;
                    updatedAct.procesos = [];
                    updatedAct.availableProcesos = [];
                    fetchProcesosForActivity(index, value);
                } else if (name === 'procesos') {
                    updatedAct.procesos = value;
                } else if (name === 'insumos') {
                    updatedAct.insumos = value;
                } else if (name === 'horaInicio' || name === 'horaFin') {
                    updatedAct[name] = value;
                    // Calcular tiempos de inicio y fin
                    const inicio = updatedAct.horaInicio;
                    const fin = updatedAct.horaFin;
                    if (inicio && fin) {
                        const inicioDate = new Date(`1970-01-01T${inicio}:00`);
                        const finDate = new Date(`1970-01-01T${fin}:00`);
                        if (finDate > inicioDate) {
                            updatedAct.tiempo = Math.floor((finDate - inicioDate) / 60000);
                        } else {
                            updatedAct.tiempo = 0;
                        }
                    } else {
                        updatedAct.tiempo = 0;
                    }
                } else {
                    updatedAct[name] = value;
                }
                return updatedAct;
            }
            return act;
        });
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

        return isNaN(date.getTime()) ? null : date.toISOString(); // Convertir a ISO string para enviar al backend
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
            fecha: jornadaData.fecha, // La fecha ya está en formato YYYY-MM-DD
            horaInicio: combinarFechaYHora(jornadaData.fecha, jornadaData.horaInicio),
            horaFin: combinarFechaYHora(jornadaData.fecha, jornadaData.horaFin),
            // Asegurarse de que oti y demás campos referenciados se envíen como string
            registros: actividades.map(actividad => ({
                ...actividad,
                oti: actividad.oti, // Asumimos que oti es un string o ObjectId
                areaProduccion: actividad.areaProduccion,
                maquina: actividad.maquina,
                procesos: actividad.procesos, // Array de IDs de procesos
                insumos: actividad.insumos, // Array de IDs de insumos
                tipoTiempo: actividad.tipoTiempo,
                horaInicio: actividad.horaInicio && actividad.horaInicio !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaInicio) : null,
                horaFin: actividad.horaFin && actividad.horaFin !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaFin) : null,
                tiempo: actividad.tiempo || 0,
                // No enviar availableProcesos al backend, es solo para el frontend
                availableProcesos: undefined
            }))
        };

        console.log("Payload enviado:", dataToSend); // DEBUG: Verificar que los campos de hora estén en el payload

        try {
            const endpoint = urlJornadaId
                ? `http://localhost:5000/api/jornadas/${urlJornadaId}`
                : "http://localhost:5000/api/jornadas/completa";
            const method = urlJornadaId ? "PUT" : "POST";

            const response = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(`Error al guardar la jornada: ${result.msg || "Error inesperado"}`);
                setLoading(false); // Ensure loading is set to false on error
                return;
            }

            toast.success("Jornada guardada exitosamente");
            if (!urlJornadaId) {
                resetFormForNewJornada(); // Call the reset function only for new jornadas
                navigate("/operario-dashboard"); // Navigate after successful creation
            } else {
                navigate("/mi-jornada"); // Navigate back to mi-jornada after edit
            }
        } catch (error) {
            console.error("Error al enviar la jornada:", error);
            toast.error("Error al guardar la jornada");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitActividad = async (e) => {
        e.preventDefault(); // Prevent default form submission if this is a separate button

        // Si solo hay una actividad y no estamos editando una jornada específica,
        // este manejador podría usarse para guardar una actividad individual.
        // Si hay múltiples actividades o estamos editando una jornada, el botón "Guardar Jornada Completa"
        // debería usar handleSubmitJornada.
        // Para simplificar, asumiremos que este manejador es para añadir una actividad a una jornada existente.

        if (!JornadaActualId) {
            toast.error("Primero debe crear o seleccionar una jornada para añadir actividades.");
            return;
        }

        setLoading(true);

        const actividadIndex = 0; // Asumiendo que solo se guarda la primera actividad del array para este botón
        const actividad = actividades[actividadIndex];

        // Enhanced validation to include areaProduccion and maquina
        if (!actividad.oti || !actividad.areaProduccion || !actividad.maquina || !actividad.tipoTiempo || !actividad.horaInicio || !actividad.horaFin) {
            toast.error("Por favor complete todos los campos requeridos de la actividad (OTI, Área, Máquina, Tipo Tiempo, Horas).");
            setLoading(false);
            return;
        }
        // Ensure procesos and insumos are arrays, even if empty
        if (!Array.isArray(actividad.procesos)) {
            toast.error("Error interno: formato de procesos incorrecto.");
            setLoading(false);
            return;
        }
        if (!Array.isArray(actividad.insumos)) {
            toast.error("Error interno: formato de insumos incorrecto.");
            setLoading(false);
            return;
        }

        const horaInicio = combinarFechaYHora(jornadaData.fecha, actividad.horaInicio);
        const horaFin = combinarFechaYHora(jornadaData.fecha, actividad.horaFin);

        if (!horaInicio || !horaFin) {
            toast.error("Las horas de inicio o fin de la actividad no son válidas o la fecha de jornada no está definida.");
            setLoading(false);
            return;
        }

        const actividadToSend = {
            ...actividad,
            fecha: jornadaData.fecha,
            horaInicio,
            horaFin,
            tiempo: actividad.tiempo || 0,
            operario: jornadaData.operario,
            jornadaId: JornadaActualId, // Asociar la actividad con la jornada actual
            // No enviar availableProcesos al backend
            availableProcesos: undefined
        };
        console.log("Datos a enviar (handleSubmitActividad):", actividadToSend);

        try {
            const response = await fetch("http://localhost:5000/api/produccion/registrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(actividadToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(`Error al guardar la actividad: ${result.msg || result.error || "Error inesperado"}`);
                return;
            }

            toast.success("Actividad guardada exitosamente");
            // Limpiar la actividad actual para una nueva entrada si no estamos editando
            setActividades(prev => prev.map((act, idx) => idx === actividadIndex ? {
                oti: "",
                procesos: [],
                areaProduccion: "",
                maquina: "",
                insumos: [],
                tipoTiempo: "",
                horaInicio: "",
                horaFin: "",
                tiempo: 0,
                observaciones: "",
                availableProcesos: []
            } : act));

            // Si estamos en una jornada existente, recargar las actividades existentes
            if (urlJornadaId) {
                // Aquí necesitaríamos una forma de recargar solo las actividades de la jornada
                // Simplificaremos recargando la página o la lógica de carga inicial.
                // Para una UX más fluida, deberías actualizar el estado de actividadesExistentes
                // con la nueva actividad guardada.
                // Por ahora, una recarga simple o una navegación puede ser suficiente.
                navigate(`/registro-produccion/${urlJornadaId}`); // Recarga la jornada para ver la nueva actividad
            } else {
                // Si no estamos editando, navegamos al dashboard del operario para ver el resumen
                navigate("/operario-dashboard");
            }
        } catch (error) {
            console.error("Error al enviar la actividad:", error);
            toast.error("Error al guardar la actividad");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-100 h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1">
                <Navbar />
                <div className="flex-1 overflow-auto">
                    <div className="container mx-auto px-4 py-10">
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

                                {/* Card para Resumen de Actividades del Día Seleccionado */}
                                {/* Mostrar solo si NO estamos editando una jornada específica */}
                                {!urlJornadaId && jornadaData.fecha && jornadaData.operario && (
                                    <Card className="mt-6 mb-4 p-6 bg-gray-50 rounded-lg shadow">
                                        <h2 className="text-xl font-semibold text-gray-700 mb-3">
                                            Resumen de Actividades para {new Date(jornadaData.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                                        </h2>
                                        {loadingResumen ? (
                                            <p className="text-gray-600">Cargando resumen...</p>
                                        ) : actividadesResumen.length > 0 ? (
                                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                                {actividadesResumen.map(act => (
                                                    <div key={act._id} className="p-3 bg-white rounded-md shadow-sm border border-gray-200">
                                                        <p className="font-medium text-blue-600">
                                                            {act.procesosNombres} {/* Usar el nombre de procesos procesado */}
                                                        </p>
                                                        <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-2">
                                                            <span><strong>OTI:</strong> {act.otiNumero}</span> {/* Usar el número de OTI procesado */}
                                                            <span>
                                                                <strong>Horario:</strong>
                                                                {act.horaInicio ? new Date(act.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"} -
                                                                {act.horaFin ? new Date(act.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600">No hay actividades registradas para esta fecha.</p>
                                        )}
                                    </Card>
                                )}

                                <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-800">
                                    {urlJornadaId ? "Actividades de la Jornada (Editando)" : "Registrar Nuevas Actividades"}
                                </h2>

                                {/* Mostrar actividades existentes si estamos editando */}
                                {urlJornadaId && actividadesExistentes.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300">Actividades Existentes</h3>
                                        {actividadesExistentes.map((act, index) => (
                                            <div key={act._id || `existing-${index}`} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-3">
                                                <p className="font-medium text-blue-800">Actividad Existente {index + 1}:</p>
                                                <ul className="text-sm text-gray-700 list-disc list-inside">
                                                    <li><strong>OTI:</strong> {act.oti}</li>
                                                    <li><strong>Área:</strong> {areasProduccionData.find(area => area._id === act.areaProduccion)?.nombre || "N/A"}</li>
                                                    <li><strong>Máquina:</strong> {maquinasData.find(maq => maq._id === act.maquina)?.nombre || "N/A"}</li>
                                                    <li><strong>Procesos:</strong> {Array.isArray(act.procesos) ? act.procesos.map(pId => actividad.availableProcesos?.find(ap => ap._id === pId)?.nombre || pId).join(', ') : "N/A"}</li>
                                                    <li><strong>Insumos:</strong> {Array.isArray(act.insumos) ? act.insumos.map(iId => insumosData.find(ins => ins._id === iId)?.nombre || iId).join(', ') : "N/A"}</li>
                                                    <li><strong>Tipo de Tiempo:</strong> {act.tipoTiempo}</li>
                                                    <li><strong>Horario:</strong> {act.horaInicio} - {act.horaFin}</li>
                                                    <li><strong>Tiempo (min):</strong> {act.tiempo}</li>
                                                    <li><strong>Observaciones:</strong> {act.observaciones || "Ninguna"}</li>
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}


                                {/* Formulario para nuevas actividades */}
                                {actividades.map((actividad, index) => (
                                    <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300">Actividad #{index + 1}</h3>

                                        {/* Row 1: OTI & Área de Producción */}
                                        <div className="grid md:grid-cols-2 gap-x-6 mb-4">
                                            <div>
                                                <label htmlFor={`oti-${index}`} className="block text-sm font-medium text-gray-700 mb-1">OTI:</label>
                                                <Input id={`oti-${index}`} type="text" name="oti" value={actividad.oti} onChange={(e) => handleActividadChange(index, e)} placeholder="N° OTI" required className="w-full" />
                                            </div>
                                            <div>
                                                <label htmlFor={`areaProduccion-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Área de Producción:</label>
                                                <Input as="select" id={`areaProduccion-${index}`} name="areaProduccion" value={actividad.areaProduccion} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                                    <option value="">Seleccionar Área</option>
                                                    {areasProduccionData.map(area => <option key={area._id} value={area._id}>{area.nombre}</option>)}
                                                </Input>
                                            </div>
                                        </div>

                                        {/* Row 2: Proceso & Máquina */}
                                        <div className="grid md:grid-cols-2 gap-x-6 mb-4">
                                            <div>
                                                <label htmlFor={`procesos-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Proceso(s):</label>
                                                <Select
                                                    inputId={`procesos-${index}`}
                                                    isMulti
                                                    name="procesos"
                                                    options={actividad.availableProcesos.map(p => ({ value: p._id, label: p.nombre }))}
                                                    value={actividad.procesos
                                                        .map(pId => {
                                                            const procesoInfo = actividad.availableProcesos.find(ap => ap._id === pId);
                                                            return procesoInfo ? { value: procesoInfo._id, label: procesoInfo.nombre } : null;
                                                        }).filter(p => p !== null)}
                                                    onChange={(selectedOptions, actionMeta) => handleActividadChange(index, selectedOptions, actionMeta)}
                                                    className="w-full basic-multi-select"
                                                    classNamePrefix="select"
                                                    placeholder="Seleccionar Proceso(s)"
                                                    isDisabled={!actividad.areaProduccion || (actividad.availableProcesos && actividad.availableProcesos.length === 0)}
                                                    styles={{
                                                        control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', '&:hover': { borderColor: 'hsl(var(--input))' } }),
                                                        placeholder: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' })
                                                    }}
                                                    required // Make required only if area is selected
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`maquina-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Máquina:</label>
                                                <Input as="select" id={`maquina-${index}`} name="maquina" value={actividad.maquina} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                                    <option value="">Seleccionar Máquina</option>
                                                    {maquinasData
                                                        .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                                        .map(maquina => <option key={maquina._id} value={maquina._id}>{maquina.nombre}</option>)}
                                                </Input>
                                            </div>
                                        </div>

                                        {/* Row 3: Insumos & Tipo de Tiempo */}
                                        <div className="grid md:grid-cols-2 gap-x-6 mb-4">
                                            <div>
                                                <label htmlFor={`insumos-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Insumo(s):</label>
                                                <Select
                                                    inputId={`insumos-${index}`}
                                                    isMulti
                                                    name="insumos"
                                                    options={insumosData.map(i => ({ value: i._id, label: i.nombre }))}
                                                    value={actividad.insumos
                                                        .map(iId => {
                                                            const insumoInfo = insumosData.find(ins => ins._id === iId);
                                                            return insumoInfo ? { value: insumoInfo._id, label: insumoInfo.nombre } : null;
                                                        }).filter(i => i !== null)}
                                                    onChange={(selectedOptions, actionMeta) => handleActividadChange(index, selectedOptions, actionMeta)}
                                                    className="w-full basic-multi-select"
                                                    classNamePrefix="select"
                                                    placeholder="Seleccionar Insumo(s) (Opcional)"
                                                    styles={{
                                                        control: (base) => ({ ...base, borderColor: 'hsl(var(--input))', '&:hover': { borderColor: 'hsl(var(--input))' } }),
                                                        placeholder: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' })
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`tipoTiempo-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tiempo:</label>
                                                <Input as="select" id={`tipoTiempo-${index}`} name="tipoTiempo" value={actividad.tipoTiempo} onChange={(e) => handleActividadChange(index, e)} required className="w-full">
                                                    <option value="">Seleccionar Tipo</option>
                                                    <option value="Productivo">Productivo</option>
                                                    <option value="Improductivo">Improductivo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </Input>
                                            </div>
                                        </div>

                                        {/* Row 4: Horas & Tiempo Calculado */}
                                        <div className="grid md:grid-cols-3 gap-x-6 mb-4">
                                            <div>
                                                <label htmlFor={`horaInicio-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio:</label>
                                                <Input id={`horaInicio-${index}`} type="time" name="horaInicio" value={actividad.horaInicio} onChange={(e) => handleActividadChange(index, e)} required className="w-full" />
                                            </div>
                                            <div>
                                                <label htmlFor={`horaFin-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Hora Fin:</label>
                                                <Input id={`horaFin-${index}`} type="time" name="horaFin" value={actividad.horaFin} onChange={(e) => handleActividadChange(index, e)} required className="w-full" />
                                            </div>
                                            <div>
                                                <label htmlFor={`tiempo-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Tiempo (minutos):</label>
                                                <Input id={`tiempo-${index}`} type="number" name="tiempo" value={actividad.tiempo} disabled className="w-full" />
                                            </div>
                                        </div>

                                        {/* Row 5: Observaciones */}
                                        <div className="mb-4">
                                            <label htmlFor={`observaciones-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Observaciones:</label>
                                            <Textarea id={`observaciones-${index}`} name="observaciones" value={actividad.observaciones} onChange={(e) => handleActividadChange(index, e)} placeholder="Notas adicionales sobre la actividad" className="w-full" rows="3" />
                                        </div>

                                        {/* Botón para eliminar actividad si hay más de una */}
                                        {actividades.length > 1 && (
                                            <div className="flex justify-end mt-4">
                                                <Button type="button" onClick={() => removeActividad(index)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
                                                    Eliminar Actividad
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="flex justify-between items-center mt-6">
                                    <Button type="button" onClick={addActividad} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
                                        Agregar Otra Actividad
                                    </Button>
                                    <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg">
                                        {loading ? "Guardando..." : (urlJornadaId ? "Actualizar Jornada" : "Guardar Jornada Completa")}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}