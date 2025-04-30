import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Input, Textarea, Button } from "../components/ui/index";
import { Sidebar } from "../components/Sidebar";
import { debugLog } from "../utils/log";

export default function RegistroPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [nombreOperario, setNombreOperario] = useState("");
    const [cedulaOperario, setCedulaOperario] = useState("");
    const timeoutId = useRef(null);

    const [formData, setFormData] = useState({
        fecha: "",
        operario: "",
        oti: "",
        proceso: "",
        areaProduccion: "",
        maquina: "",
        tiempoPreparacion: "",
        tiempoOperacion: "",
        observaciones: "",
    });

    const [suggestions, setSuggestions] = useState({ oti: [] });
    const [selectedIds, setSelectedIds] = useState({ oti: null, proceso: null, areaProduccion: null, maquina: null });
    const [maquinasData, setMaquinasData] = useState([]);
    const [areasProduccionData, setAreasProduccionData] = useState([]);
    const [procesosData, setProcesosData] = useState([]);


    useEffect(() => {
        const operario = localStorage.getItem("operario");

        if (!operario) {
            toast.error("No tienes acceso. Valida cédula.");
            navigate("/validate-cedula");
            return;
        }

        try {
            const operarioData = JSON.parse(operario);
            debugLog("📌 JSON parseado:", operarioData);

            if (operarioData?.name) setNombreOperario(operarioData.name);
            if (operarioData?.cedula) setCedulaOperario(operarioData.cedula);
        } catch (error) {
            console.error("❌ Error al leer datos del operario:", error);
        }

        //cargar los datos para los selectores
        const loadSelectporData = async () => {
            try {
                const maquinasRes = await fetch("http://localhost:5000/api/produccion/maquinas");
                if (maquinasRes.ok) {
                    const data = await maquinasRes.json();
                    setMaquinasData(data);
                }else {
                    console.error("Error al cargar maquinas:", maquinasRes.status);
                }

                const areasRes = await fetch("http://localhost:5000/api/produccion/areas");
                if (areasRes.ok) {
                    const data = await areasRes.json();
                    setAreasProduccionData(data);
                }else {
                    console.error("Error al cargar areas de produccion:", areasRes.status);
                }

                const procesosRes = await fetch("http://localhost:5000/api/produccion/procesos");
                if (procesosRes.ok) {
                    const data = await procesosRes.json();
                    setProcesosData(data);
                }else {
                    console.error("Error al cargar procesos:", procesosRes.status);
                }
            } catch (error) {
                console.error("Error al cargar datos de los selectores:", error);
            }
        };
        loadSelectporData();
    }, [navigate]);

    const handleChange = async (e) => {
        const { name, value } = e.target;
        const sanitizedValue = value.trim();

        setFormData((prev) => ({
            ...prev,
            [name]: name.includes("tiempo") ? Math.max(0, Number(value)) : value,
        }));

        if (name === "oti" && sanitizedValue) {
            if (timeoutId.current) clearTimeout(timeoutId.current);
            timeoutId.current = setTimeout(() => fetchSuggestions(name, sanitizedValue), 500);
        } else if (name === "oti" && !sanitizedValue) {
            setSuggestions((prev) => ({ ...prev, [name]: [] }));
        }
    };

    const fetchSuggestions = async (name, value) => {
        try {
            debugLog(`🔍 Buscando ${name}: ${value}`);
            const res = await fetch(
                `http://localhost:5000/api/buscar/${name}?${name === "oti" ? "numeroOti" : "nombre"}=${encodeURIComponent(value)}`
            );

            if (!res.ok) {
                if (res.status === 404) {
                    console.warn(`⚠️ No se encontró ${name}: ${value}`);
                    setSuggestions((prev) => ({ ...prev, [name]: [] }));
                    return;
                }
                throw new Error(`Error al buscar ${name}: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            setSuggestions((prev) => ({ ...prev, [name]: data }));
        } catch (error) {
            console.error(`Error buscando ${name}:`, error);
        }
    };

    const handleBlur = async (e) => {
        const { name, value } = e.target;
        debugLog(`📌 handleBlur: ${name} - Valor ingresado: ${value}`);

        if (name === "oti" && value.trim()) {
            const id = await verificarYCrear(value, name);
            setSelectedIds((prev) => ({ ...prev, [name]: id }));
        }
    };

    const verificarYCrear = async (valor, nombreColeccion) => {
        if (!valor.trim()) return null;

        try {
            debugLog(`🔎 Buscando en ${nombreColeccion} con valor: "${valor}"`);
            const res = await fetch(
                `http://localhost:5000/api/buscar/${nombreColeccion}?${nombreColeccion === "oti" ? "numeroOti" : "nombre"}=${encodeURIComponent(valor.trim())}`
            );

            if (res.status === 404) {
                console.warn(`⚠️ ${nombreColeccion} no encontrada: ${valor}, creando automáticamente...`);
                return await crearNuevaEntidad(valor, nombreColeccion);
            }

            if (!res.ok) throw new Error(`Error al buscar ${nombreColeccion}: ${res.status} ${res.statusText}`);

            const data = await res.json();
            const encontrado = Array.isArray(data)
                ? data.find((item) => String(item.numeroOti || item.nombre) === String(valor))
                : data;

            return encontrado?._id || null;
        } catch (error) {
            console.error(`❌ Error en verificarYCrear(${nombreColeccion}):`, error);
            return null;
        }
    };

    const crearNuevaEntidad = async (valor, nombreColeccion) => {
        try {
            debugLog(`📤 Intentando crear nueva entidad en ${nombreColeccion} con valor: "${valor}"`);
            const bodyData = nombreColeccion === "oti" ? { numeroOti: valor.trim() } : { nombre: valor.trim() };

            const res = await fetch(`http://localhost:5000/api/crear/${nombreColeccion}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });

            if (!res.ok) throw new Error(`❌ Error al crear ${nombreColeccion}: ${res.status} ${res.statusText}`);

            const data = await res.json();
            return data.id || data._id || null;
        } catch (error) {
            console.error(`❌ Error al crear ${nombreColeccion}:`, error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedIds.oti && !formData.oti.trim()) {
            toast.error("La OTI no ha sido validada o creada correctamente.");
            setLoading(false);
            return;
        }

        const storedOperator = localStorage.getItem("operario");
        const operario = storedOperator ? JSON.parse(storedOperator) : null;
        const idOperario = operario?._id || operario?.id;

        if (!idOperario) {
            toast.error("Error: No se encontró el ID del operario.");
            setLoading(false);
            return;
        }

        const datosAEnviar = {
            ...formData,
            cedula: cedulaOperario,
            operario: idOperario,
            oti: selectedIds.oti ||(await verificarYCrear(formData.oti, "oti")) || formData.oti,
            proceso: formData.proceso,
            areaProduccion:  formData.areaProduccion,
            maquina:  formData.maquina,
            tiempoPreparacion: Number(formData.tiempoPreparacion),
            tiempoOperacion: Number(formData.tiempoOperacion),
        };

        // Ajustar la fecha para incluir la zona horaria local
        if (datosAEnviar.fecha) {
            const localDate = new Date(datosAEnviar.fecha);
            localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset());
            datosAEnviar.fecha = localDate.toISOString();
        }

        try {
            const response = await fetch("http://localhost:5000/api/produccion/registrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosAEnviar),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(`Error del servidor: ${result.error || "Respuesta inesperada"}`);
                return;
            }

            toast.success("Registro guardado correctamente");
            navigate("/operario-dashboard");
        } catch (error) {
            toast.error("Error al registrar producción");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex justify-center items-start py-10 px-6 overflow-y-auto">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Registrar Producción</h1>
                    <form onSubmit={handleSubmit} className="grid gap-5">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Operario:</label>
                            <Input type="text" value={nombreOperario || "Cargando..."} disabled />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Fecha:</label>
                            <Input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required />
                        </div>

                        <label className= "block text-gray-700 font-medium mb-1">OTI:</label>
                        <div className="relative">                            
                                <Input
                                    type="text"
                                    name="oti"
                                    value={formData.oti}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="OTI"
                                    required
                                />
                                {suggestions.oti?.length > 0 && (
                                    <ul className="absolute bg-white border rounded w-full mt-1 shadow-md z-10">
                                        {suggestions.oti.map((item) => (
                                            <li
                                                key={item._id}
                                                className="p-2 hover:bg-gray-200 cursor-pointer"
                                                onClick={() => {
                                                    setFormData((prev) => ({ ...prev, oti: item.numeroOti }));
                                                    setSuggestions((prev) => ({ ...prev, oti: [] }));
                                                    setSelectedIds((prev) => ({ ...prev, oti: item._id }));
                                                }}
                                            >
                                                {item.numeroOti}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Maquina:</label>
                                <Input as ="select" name= "maquina" value={formData.maquina} onChange={handleChange} required>
                                    <option value="">Seleccionar Maquina</option>
                                    {maquinasData.map((maquina) => (
                                        <option key={maquina._id} value={maquina._id}>
                                            {maquina.nombre}
                                        </option>
                                    ))}
                                </Input>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Area de Produccion:</label>
                                <Input as ="select" name= "areaProduccion" value={formData.areaProduccion} onChange={handleChange} required>
                                    <option value="">Seleccionar Area de Produccion</option>
                                    {areasProduccionData.map((areaProduccion) => (
                                        <option key={areaProduccion._id} value={areaProduccion._id}>
                                            {areaProduccion.nombre}
                                        </option>
                                    ))}
                                </Input>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Proceso:</label>
                                <Input as ="select" name= "proceso" value={formData.proceso} onChange={handleChange} required>
                                    <option value="">Seleccionar Proceso</option>
                                    {procesosData.map((proceso) => (
                                        <option key={proceso._id} value={proceso._id}>
                                            {proceso.nombre}
                                        </option>
                                    ))}
                                </Input>
                            </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Tiempo de Preparación (min):</label>
                            <Input
                                type="number"
                                name="tiempoPreparacion"
                                value={formData.tiempoPreparacion}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Tiempo de Operación (min):</label>
                            <Input
                                type="number"
                                name="tiempoOperacion"
                                value={formData.tiempoOperacion}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Observaciones:</label>
                            <Textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                placeholder="Observaciones"
                            />
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            <Button 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow-md transition cursor-pointer" 
                                variant="ghost" onClick={() => navigate('/operario-dashboard')}>
                                Atras
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md shadow-md transition"
                            >
                                {loading ? "Guardando..." : "Registrar"}
                            </Button>
                            
                        </div>
                    </form>
                    <ToastContainer />
                </div>
            </div>
        </div>
    );
}