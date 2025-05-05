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
import EditarProduccion from './EditarProduccion'; // Importa el nuevo componente

// Registrar componentes necesarios para el gráfico
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const OperarioDashboard = () => {
  const [producciones, setProducciones] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState(null); // Cambiado a ID para identificar la producción a editar
  const produccionAEditar = producciones.find(prod => prod._id === editandoId);
  const [actualizar, setActualizar] = useState(false);
  const navigate = useNavigate();

  const storedOperario = JSON.parse(localStorage.getItem('operario'));
  const operarioName = storedOperario?.name || 'Operario';

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

  const produccionesFiltradas = (Array.isArray(producciones) ? producciones : []).filter((p) =>
    (p.oti?.numeroOti || "").toString().toLowerCase().includes(filtro.toLowerCase())
  );

  const indiceFinal = paginaActual * registrosPorPagina;
  const indiceInicial = indiceFinal - registrosPorPagina;
  const produccionesPaginadas = produccionesFiltradas.slice(indiceInicial, indiceFinal);

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

  const iniciarEdicion = (produccion) => {
    debugLog("Iniciando edición para:", produccion._id);
    setEditandoId(produccion._id);
  };

  const cerrarModalEditar = () => {
    setEditandoId(null);
  };

  const recargarProducciones = () => {
    setActualizar((prev) => !prev);
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
        {editandoId !== null && (
            <EditarProduccion
              produccion={produccionAEditar}
              onClose={cerrarModalEditar}
              onGuardar={recargarProducciones}
            />
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
                <th className="p-2">Area</th>
                <th className="p-2">Maquina</th>
                <th className="p-2">Proceso</th>
                <th className="p-2">Insumo</th>
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
                  <td className="p-2">{prod.areaProduccion?.nombre}</td>
                  <td className="p-2">{prod.maquina?.nombre}</td> 
                  <td className="p-2">{prod.proceso?.nombre}</td>
                  <td className="p-2">{prod.insumos?.nombre}</td>                             
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