import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debugLog } from '../utils/log';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import Navbar from '../components/Navbar';
import { Input, Button, Card } from '../components/ui/index';
import { verificarYCrear } from '../utils/verificarYCrear';

// Registrar componentes necesarios para el gráfico
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const OperarioDashboard = () => {
    const [producciones, setProducciones] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 5;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editando, setEditando] = useState(null);
    const [registroEditado, setRegistroEditado] = useState({});
    const [actualizar, setActualizar] = useState(false);
    const navigate = useNavigate();

    const storedOperario = JSON.parse(localStorage.getItem('operario'));
    const operarioName = storedOperario?.name || 'Operario';

    // Obtener producciones del backend
    const fetchProducciones = async () => {
        try {
            setLoading(true);
            const storedOperator = localStorage.getItem('operario');
            if (!storedOperator) {
                console.error('No se encontró información del operario.');
                setError('No se encontró información del operario.');
                setProducciones([]);
                setLoading(false);
                return;
            }

            const operario = JSON.parse(storedOperator);
            const idOperario = operario.id || operario._id;

            debugLog("Operario obtenido en Dashboard:", operario);
            debugLog("ID del operario utilizado:", idOperario);

            if (!idOperario) {
                setError('ID de operario no válido.');
                setProducciones([]);
                setLoading(false);
                return;
            }

            const response = await axiosInstance.get(`/produccion/filtrar?operario=${operario._id}`);
            let data = response.data;

            debugLog("Datos recibidos de la API:", data);

            if (!Array.isArray(data)) {
                console.warn("⚠️ La API no devolvió un array, asignando []");
                data = [];
            }

            setProducciones([...data]);
            setError(null);
        } catch (error) {
            console.error('Error al obtener las producciones:', error);
            setError('No se pudieron cargar los datos.');
            setProducciones([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      fetchProducciones();
    }, [actualizar]);
   
    useEffect(() => {
        debugLog("Estado editando:", editando);
        debugLog("Estado registroEditado:", registroEditado);
    }, [editando, registroEditado]);

    useEffect(() => {
        debugLog("El estado 'actualizar' ha cambiado:", actualizar);
    }, [actualizar]);

    const produccionesFiltradas = (Array.isArray(producciones) ? producciones : []).filter((p) =>
        (p.oti?.numeroOti || "").toString().toLowerCase().includes(filtro.toLowerCase())
    );

    const indiceFinal = paginaActual * registrosPorPagina;
    const indiceInicial = indiceFinal - registrosPorPagina;
    const produccionesPaginadas = produccionesFiltradas.slice(indiceInicial, indiceFinal);

    const validarCampos = () => {
        const { oti, proceso, maquina, areaProduccion, tiempoPreparacion, tiempoOperacion } = registroEditado;
        if (
            !oti?.numeroOti || 
            !proceso?.nombre || 
            !maquina?.nombre || 
            !areaProduccion?.nombre ||
            !tiempoPreparacion || 
            !tiempoOperacion
        ) {
            toast.error("⚠️ Todos los campos son obligatorios.");
            return false;
        }
        return true;
    };

    const handleEliminar = (id) => {
        confirmAlert({
            title: '¿Estás seguro?',
            message: '¿Quieres eliminar esta producción?',
            buttons: [
                {
                    label: 'Sí',
                    onClick: async () => {
                        try {
                            await axiosInstance.delete(`/produccion/eliminar/${id}`);
                            setActualizar((prev) => !prev);
                            toast.success("Producción eliminada");
                        } catch (error) {
                            console.error('Error al eliminar:', error);
                            toast.error('No se pudo eliminar.');
                        }
                    }
                },
                {
                    label: 'Cancelar',
                    onClick: () => {}
                }
            ]
        });
    };

    // Iniciar edición de un registro
    const iniciarEdicion = (produccion) => {
        debugLog("Iniciando edición para:", produccion._id);
    
        // Formatear fecha si existe
        const fechaFormateada = produccion.fecha 
            ? new Date(produccion.fecha).toISOString().split('T')[0]
            : "";
    
        // Inicializar registroEditado con los datos actuales
        setRegistroEditado({ 
            ...produccion,
            fecha: fechaFormateada,
            oti: { _id: produccion.oti?._id || "",numeroOti: produccion.oti?.numeroOti || ""},
            proceso: { _id: produccion.proceso?._id || "",nombre: produccion.proceso?.nombre || ""},
            maquina: { _id: produccion.maquina?._id || "",nombre: produccion.maquina?.nombre || ""},
            areaProduccion: {_id: produccion.areaProduccion?._id || "",nombre: produccion.areaProduccion?.nombre || ""}
        });
        // Activar modo edición
        setEditando(produccion._id);
      
        // Log the updated states
        debugLog("Estado editando:", produccion._id);
        debugLog("Estado registroEditado:", {
            ...produccion,
            fecha: fechaFormateada,
        });
    };
        
    // Guardar cambios de edición
    const guardarEdicion = async (id) => {
      try {
        if (!registroEditado || Object.keys(registroEditado).length === 0) {
          toast.error("⚠️ No hay datos para guardar.");
          return;
        }
    
        // Normaliza cualquier texto ingresado por el usuario
        const normalizarTexto = (texto) => (typeof texto === 'string' ? texto.trim().toLowerCase() : texto);
    
        // 🛠 Verificar si las entidades ya existen o se deben crear
        const otiId = await verificarYCrear(normalizarTexto(registroEditado.oti?.numeroOti || ''), "oti");
        const procesoId = await verificarYCrear(normalizarTexto(registroEditado.proceso?.nombre || ''), "proceso");
        const areaId = await verificarYCrear(normalizarTexto(registroEditado.areaProduccion?.nombre || ''), "areaProduccion");
        const maquinaId = await verificarYCrear(normalizarTexto(registroEditado.maquina?.nombre || ''), "maquina");
    
        // Validación extra por si alguna entidad no se pudo crear
        if (!otiId || !procesoId || !areaId || !maquinaId) {
          toast.error("❌ No se pudieron crear todas las entidades requeridas.");
          return;
        }
    
        const datosActualizados = {
          _id: registroEditado._id,
          oti: otiId,
          operario: registroEditado.operario?._id || registroEditado.operario,
          proceso: procesoId,
          areaProduccion: areaId,
          maquina: maquinaId,
          fecha: registroEditado.fecha || null,
          tiempoPreparacion: parseInt(registroEditado.tiempoPreparacion, 10),
          tiempoOperacion: parseInt(registroEditado.tiempoOperacion, 10),
        };
    
        debugLog("🧾 Datos que se envían al backend:", datosActualizados);
    
        const response = await axiosInstance.put(`/produccion/actualizar/${id}`, datosActualizados);
    
        if (response.status >= 200 && response.status < 300) {
          debugLog("✅ Producción actualizada con éxito:", response.data);
    
          // Reset de estados y recarga de producciones
          setEditando(null);
          setRegistroEditado({});
          setActualizar((prev) => !prev);
          toast.success("✅ Producción actualizada con éxito");
        } else {
          throw new Error("⚠️ La respuesta del servidor no indica éxito.");
        }
    
      } catch (error) {
        console.error('❌ Error al editar la producción:', error);
        if (error.response) {
          toast.error(`Error: ${error.response.data.message || "No se pudo guardar la edición."}`);
        } else {
          toast.error(`⚠️ Error: ${error.message}`);
        }
      }
    };
    
       
    const confirmarEdicion = (id) => {
      console.log("ID que se pasa a guardarEdicion:", id);
      confirmAlert({
        title: '¿Guardar cambios?',
        message: '¿Deseas guardar los cambios realizados?',
        buttons: [
          {
            label: 'Sí',
            onClick: () => guardarEdicion(id) // Esto ya se encarga de cerrar
          },
          {
            label: 'Cancelar',
            onClick: () => {
              // ❌ NO cierres el modal aquí
              console.log("Edición cancelada por el usuario");
              // Si quieres puedes dejar el modal abierto, sin tocar `editando`
            }
          }
        ]
      });
    };
    
    // Datos para el gráfico
    const chartData = {
        labels: producciones.map((p) => p.oti?.numeroOti?.trim() || 'N/A'),
        datasets: [
          {
            label: 'Preparación (min)',
            data: producciones.map((p) => p.tiempoPreparacion),
            backgroundColor: 'rgba(96, 165, 250, 0.7)', // azul claro
            borderRadius: 8,
            barThickness: 30,
          },
          {
            label: 'Operación (min)',
            data: producciones.map((p) => p.tiempoOperacion),
            backgroundColor: 'rgba(34, 197, 94, 0.7)', // verde suave
            borderRadius: 8,
            barThickness: 30,
          },
        ],
      };
      

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#374151', // texto gris oscuro
              font: {
                size: 14,
                family: 'Inter, sans-serif',
              },
            },
          },
          title: {
            display: true,
            text: 'Tiempos de Producción',
            color: '#1F2937', // gris muy oscuro
            font: {
              size: 18,
              family: 'Inter, sans-serif',
              weight: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            backgroundColor: '#F3F4F6',
            titleColor: '#111827',
            bodyColor: '#374151',
            borderColor: '#D1D5DB',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#374151',
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
            },
            grid: {
              color: '#E5E7EB',
              borderDash: [3, 3],
            },
          },
        },
      };
      
    // Redirigir al formulario de registro de nueva producción
    const handleRegistroProduccion = () => {
        navigate('/registro-produccion');
    };

    return (
        <>
        
            <Navbar />
            
        {/* 🔁 Modal de edición */}
        {editando !== null && Object.keys(registroEditado).length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <Card className="w-full max-w-lg p-6 rounded-2xl shadow-2xl bg-white">
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Editar Producción</h2>
            <form className="space-y-4">
              <Input
                label="OTI"
                value={registroEditado.oti?.numeroOti || ''}
                onChange={(e) =>
                  setRegistroEditado({
                    ...registroEditado,
                    oti: { ...registroEditado.oti, numeroOti: e.target.value },
                  })
                }
              />
              <Input
                label="Fecha"
                type="date"
                value={registroEditado.fecha?.split('T')[0] || ''}
                onChange={(e) =>
                  setRegistroEditado({ ...registroEditado, fecha: e.target.value })
                }
              />
              <Input
                label="Proceso"
                value={registroEditado.proceso?.nombre || ''}
                onChange={(e) =>
                  setRegistroEditado({
                    ...registroEditado,
                    proceso: { ...registroEditado.proceso, nombre: e.target.value },
                  })
                }
              />
              <Input
                label="Máquina"
                value={registroEditado.maquina?.nombre || ''}
                onChange={(e) =>
                  setRegistroEditado({
                    ...registroEditado,
                    maquina: { ...registroEditado.maquina, nombre: e.target.value },
                  })
                }
              />
              <Input
                label="Área de Producción"
                value={registroEditado.areaProduccion?.nombre || ''}
                onChange={(e) =>
                  setRegistroEditado({
                    ...registroEditado,
                    areaProduccion: { ...registroEditado.areaProduccion, nombre: e.target.value },
                  })
                }
              />
              <Input
                label="Tiempo de Preparación (min)"
                type="number"
                value={registroEditado.tiempoPreparacion || ''}
                onChange={(e) =>
                  setRegistroEditado({
                    ...registroEditado,
                    tiempoPreparacion: e.target.value,
                  })
                }
              />
              <Input
                label="Tiempo de Operación (min)"
                type="number"
                value={registroEditado.tiempoOperacion || ''}
                onChange={(e) =>
                  setRegistroEditado({
                    ...registroEditado,
                    tiempoOperacion: e.target.value,
                  })
                }
              />
              <div className="flex justify-end gap-4 pt-4">
                <Button
                type="button"
                    onClick={() => {
                        if (validarCampos()) {
                            if (editando) {
                              console.log("ID que se pasa a confirmarEdicion:", editando);
                              confirmarEdicion(editando);
                            } else {
                                console.error("No hay un registro en edición.");
                            }
                        }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Guardar Cambios
                </Button>
                <Button variant="secondary" onClick={() => setEditando(null)}
                    className="border-gray-300"
                    >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}


      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Producción VR Mideros</h1>
          <h3 className="font-semibold">{operarioName}</h3>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button className="bg-blue-200 blue font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all duration-300 cursor-pointer" onClick={handleRegistroProduccion}>Registrar Nueva Producción</Button>
          <Button className="bg-red-200 text-gray-800 hover:bg-red-500 hover:text-red-100 px-6 py-3 rounded-xl shadow transition-all duration-300 cursor-pointer" variant="ghost" onClick={() => navigate('/validate-cedula')}>
            Salir
          </Button>
        </div>

        <div className="mt-6 mb-4 max-w-sm">
          <Input
            placeholder="Buscar por OTI..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white text-sm rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">OTI</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Proceso</th>
                <th className="p-2">Máquina</th>
                <th className="p-2">Área</th>
                <th className="p-2">Preparación</th>
                <th className="p-2">Operación</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {produccionesPaginadas.map((prod) => (
                <tr key={prod._id} className="text-center border-t">
                  <td className="p-2">{prod.oti?.numeroOti}</td>
                  <td className="p-2">{new Date(prod.fecha).toISOString().split('T')[0]}</td>
                  <td className="p-2">{prod.proceso?.nombre}</td>
                  <td className="p-2">{prod.maquina?.nombre}</td>
                  <td className="p-2">{prod.areaProduccion?.nombre}</td>
                  <td className="p-2">{prod.tiempoPreparacion} min</td>
                  <td className="p-2">{prod.tiempoOperacion} min</td>
                  <td className="p-2">
                    <div className= "inline-flex">
                    <Button 
                    className="bg-green-300 hover:bg-green-400 text-gray-800 font-bold py-1 px-3 rounded-l" onClick={() => iniciarEdicion(prod)}>
                      Editar
                    </Button>
                    <Button 
                    className= "bg-red-300 hover:bg-red-400 text-gray-800 font-bold py-1 px-3 rounded-r" variant="destructive" onClick={() => handleEliminar(prod._id)}>
                      Eliminar
                    </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔁 Paginación */}
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
          >
            Anterior
          </Button>
          <Button
            onClick={() => setPaginaActual((p) => p + 1)}
            disabled={indiceFinal >= produccionesFiltradas.length}
          >
            Siguiente
          </Button>
        </div>

        {/* 📊 Gráfico de barras */}
        <Card className="mt-6 p-4">
          {producciones.length === 0 ? (
            <p className="text-gray-500">No hay registros de producción disponibles.</p>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </Card>

      </div>
    </>
  );
};

export default OperarioDashboard;