import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import FilterPanel from '../components/filters/FilterPanel';
import * as XLSX from 'xlsx';
import { SidebarAdmin } from '../components/SidebarAdmin';
import axiosInstance from '../utils/axiosInstance';
import Pagination from '../components/Pagination'; 
import { toast } from 'react-toastify';
import { Button, Card } from '../components/ui';

// Helper function to parse date strings as local dates at midnight
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  // Assuming dateString is in 'YYYY-MM-DD' format from input type="date"
  // or a full ISO string from the backend that needs to be treated as local
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day); // Month is 0-indexed
};

const columnOptions = [
  { key: 'fecha', label: 'Fecha', defaultVisible: true },
  { key: 'proceso', label: 'Proceso', defaultVisible: true },
  { key: 'maquina', label: 'Máquina', defaultVisible: false },
  { key: 'area', label: 'Área', defaultVisible: false },
  { key: 'insumos', label: 'Insumos', defaultVisible: false },
  { key: 'observaciones', label: 'Observaciones', defaultVisible: false },
  { key: 'tipoTiempo', label: 'Tipo de Tiempo', defaultVisible: true },
  { key: 'tiempo', label: 'Tiempo (min)', defaultVisible: true },
];

const AdminDashboard = () => {
  const [resultados, setResultados] = useState([]);
  const [totalHoras, setTotalHoras] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Define cuántos resultados mostrar por página
  const [totalResults, setTotalResults] = useState(0); // Para saber cuántos resultados totales hay
  const [error, setError] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null); // New state for active filters
 
  // State for individual column visibility
  const [columnVisibility, setColumnVisibility] = useState(
    columnOptions.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible;
      return acc;
    }, {})
  );
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const handleColumnToggle = (columnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const getTipoTiempoBadge = (tipoTiempo) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    if (tipoTiempo) {
      const lowerTipoTiempo = tipoTiempo.toLowerCase();
      if (lowerTipoTiempo.includes('operacion') || lowerTipoTiempo.includes('operación')) {
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
      } else if (lowerTipoTiempo.includes('preparacion') || lowerTipoTiempo.includes('preparación')) {
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
      } else if (lowerTipoTiempo.includes('alimentacion') || lowerTipoTiempo.includes('alimentación')) {
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
      }  else if (lowerTipoTiempo.includes('mantenimiento')) {
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
      }
    }

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor} whitespace-nowrap`}>
        {tipoTiempo || 'N/A'}
      </span>
    );
  };

  const calcularTotalHoras = (data) => {
    if (Array.isArray(data)) {
      const total = data.reduce((sum, r) => sum + (r.tiempo || 0), 0);
      setTotalHoras(total);
    } else {
      setTotalHoras(0);
    }
  };

    const handleBuscar = async (filtrosRecibidos) => {
        setLoading(true);
        setError(null);
        setCurrentPage(1); 
        setCurrentFilters(filtrosRecibidos);

        try {
            const filtrosAjustados = { ...filtrosRecibidos };
            if (filtrosRecibidos.fechaInicio) {
                const date = new Date(filtrosRecibidos.fechaInicio);
                date.setDate(date.getDate() - 1);
                filtrosAjustados.fechaInicio = date.toISOString();
            }
            if (filtrosRecibidos.fechaFin) {
                const date = new Date(filtrosRecibidos.fechaFin);
              
                date.setHours(23, 59, 59, 999); 
                filtrosAjustados.fechaFin = date.toISOString();
            }

            const params = {
                page: 1, 
                limit: itemsPerPage,
                ...filtrosAjustados,
            };

            const response = await axiosInstance.get('/produccion/buscar-produccion', { params });

            if (response.data.resultados && Array.isArray(response.data.resultados)) {
                let resultadosOrdenados = response.data.resultados;

                // Ordenar por fecha si no hay filtros aplicados (o si es una búsqueda inicial sin filtros específicos)
                if (!filtrosRecibidos || Object.keys(filtrosRecibidos).length === 0) {
                    resultadosOrdenados = resultadosOrdenados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                }

                setResultados(resultadosOrdenados);
                calcularTotalHoras(resultadosOrdenados);
                setTotalResults(response.data.totalResultados || response.data.totalResults || 0);
            } else {
                setResultados([]);
                setTotalHoras(0);
                setTotalResults(0);
                toast.info(response.data?.msg || 'Sin resultados para los filtros aplicados.');
            }
        } catch (err) {
            setError('No se pudo buscar los registros. Intenta de nuevo más tarde.');
            setResultados([]);
            setTotalHoras(0);
            setTotalResults(0);
            toast.error('No se pudo buscar los registros. Intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

  // 🔄 Cargar producciones (filtered or all)
  const cargarProducciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (currentFilters && Object.keys(currentFilters).length > 0) {
        // Fetch filtered data
        const filtrosAjustados = { ...currentFilters };
        if (currentFilters.fechaInicio) {
            const date = new Date(currentFilters.fechaInicio);
            filtrosAjustados.fechaInicio = date.toISOString();
        }
        if (currentFilters.fechaFin) {
            const date = new Date(currentFilters.fechaFin);
            date.setHours(23, 59, 59, 999);
            filtrosAjustados.fechaFin = date.toISOString();
        }

        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...filtrosAjustados,
        };
        response = await axiosInstance.get('/produccion/buscar-produccion', { params });
      } else {
        // Fetch all data (paginated)
        response = await axiosInstance.get(`/admin/admin-producciones?page=${currentPage}&limit=${itemsPerPage}`);
      }

      if (response.data.resultados && Array.isArray(response.data.resultados)) {
        setResultados(response.data.resultados);
        setTotalResults(response.data.totalResultados || response.data.totalResults || 0);
        calcularTotalHoras(response.data.resultados);
      } else {
        setResultados([]);
        setTotalResults(0);
        setTotalHoras(0);
      }
    } catch (error) {
      setError("No se pudieron cargar los registros. Intenta de nuevo más tarde.");
      setResultados([]);
      setTotalResults(0);
      setTotalHoras(0);
      toast.error("No se pudieron cargar los registros. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, currentFilters]); 

  useEffect(() => {
    cargarProducciones();
  }, [cargarProducciones]);

  const exportarExcel = async () => {
    try {
      let allResults = [];
      if (currentFilters && Object.keys(currentFilters).length > 0) {
        // Si hay filtros, pedir todos los resultados filtrados (sin paginación)
        const filtrosAjustados = { ...currentFilters };
        if (currentFilters.fechaInicio) {
          const date = new Date(currentFilters.fechaInicio);
          filtrosAjustados.fechaInicio = date.toISOString();
        }
        if (currentFilters.fechaFin) {
          const date = new Date(currentFilters.fechaFin);
          date.setHours(23, 59, 59, 999);
          filtrosAjustados.fechaFin = date.toISOString();
        }
        const params = {
          page: 1,
          limit: 10000, // Asume que nunca habrá más de 10,000 resultados filtrados
          ...filtrosAjustados,
        };
        const response = await axiosInstance.get('/produccion/buscar-produccion', { params });
        allResults = response.data.resultados || [];
      } else {
        // Si no hay filtros, pedir todos los resultados (sin paginación)
        const response = await axiosInstance.get('/admin/admin-producciones?page=1&limit=10000');
        allResults = response.data.resultados || [];
      }
      if (!allResults.length) {
        toast.info('No hay datos para exportar.');
        return;
      }
      const rows = allResults.map((r) => ({
        Fecha: new Date(r.fecha).toLocaleDateString(),
        Area: r.areaProduccion?.nombre || '',
        OTI: r.oti?.numeroOti || '',
        Proceso: r.procesos && r.procesos.length > 0 ? r.procesos.map(p => p.nombre).join(', ') : '',
        Maquina: r.maquina?.nombre || '',
        Insumos: r.insumos && r.insumos.length > 0 ? r.insumos.map(i => i.nombre).join(', ') : '',
        Operario: r.operario?.name || '',
        'Tipo de Tiempo': r.tipoTiempo || '',
        'Hora Inicio': r.horaInicio ? new Date(r.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        'Hora Fin': r.horaFin ? new Date(r.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        Tiempo: r.tiempo,
        Observaciones: r.observaciones || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Producción');
      XLSX.writeFile(wb, 'produccion.xlsx');
    } catch (error) {
      toast.error('No se pudo exportar el Excel. Intenta de nuevo más tarde.');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // No direct fetch here, useEffect will handle it due to currentPage change
    console.log("Página cambiada a:", newPage);
  };


  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 overflow-hidden">
        {/* Sidebar con ancho fijo y scroll independiente */}
        <div className="h-screen w-64 flex-shrink-0 bg-white shadow-lg z-20 overflow-y-auto">
          <SidebarAdmin />
        </div>

        {/* Contenido principal con scroll y ancho flexible */}
        <div className="flex-1 flex flex-col bg-transparent overflow-auto min-w-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-w-0">
            {/* Encabezado */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 tracking-tight drop-shadow-sm">Consultas de Producción</h1>
                <p className="text-base md:text-lg text-gray-500 mt-1">Panel de consulta y exportación de registros de producción</p>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="primary" onClick={exportarExcel} className="shadow">Exportar Excel</Button>
              </div>
            </div>

            {/* Filtros */}
            <Card className="mb-6 p-4 shadow-lg border border-blue-100">
              <FilterPanel onBuscar={handleBuscar} onExportar={exportarExcel} />
            </Card>

            {/* Resultados */}
            <Card className="mb-8 p-4 shadow-lg border border-blue-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <h2 className="text-xl font-bold text-blue-700">Resultados</h2>
                <div className="relative inline-block text-left ml-auto mr-2 md:mr-0 md:ml-4 order-first md:order-none">
                  <Button 
                    onClick={() => setIsColumnDropdownOpen(prev => !prev)} 
                    variant="outline" 
                    size="sm"
                  >
                    Configurar Columnas
                  </Button>
                  {isColumnDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {columnOptions.map(col => (
                          <label key={col.key} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left cursor-pointer" role="menuitem">
                            <input
                              type="checkbox"
                              checked={!!columnVisibility[col.key]}
                              onChange={() => handleColumnToggle(col.key)}
                              className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            {col.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-base text-right md:text-left">Total de minutos trabajados: <span className="font-semibold text-blue-600">{totalHoras}</span></p>
              </div>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <span className="loader border-blue-500"></span>
                  <span className="ml-2 text-blue-500">Cargando registros...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full bg-white rounded text-sm">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="p-2 font-semibold text-blue-800">OTI</th>
                        <th className="p-2 font-semibold text-blue-800">Operario</th>
                        {columnVisibility.fecha && <th className="p-2 font-semibold text-blue-800">Fecha</th>}
                        {columnVisibility.proceso && <th className="p-2 font-semibold text-blue-800">Proceso</th>}
                        {columnVisibility.maquina && <th className="p-2 font-semibold text-blue-800">Máquina</th>}
                        {columnVisibility.area && <th className="p-2 font-semibold text-blue-800">Área</th>}
                        {columnVisibility.insumos && <th className="p-2 font-semibold text-blue-800">Insumos</th>}
                        {columnVisibility.observaciones && <th className="p-2 font-semibold text-blue-800">Observaciones</th>}
                        {columnVisibility.tipoTiempo && <th className="p-2 font-semibold text-blue-800">Tipo de Tiempo</th>}
                        {columnVisibility.tiempo && <th className="p-2 font-bold text-blue-800">Tiempo (min)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r, idx) => (
                        <tr
                          key={r._id}
                          className={`text-center border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition`}
                        >
                          <td className="p-2 whitespace-nowrap">{r.oti?.numeroOti || 'N/A'}</td>
                          <td className="p-2 whitespace-nowrap">{r.operario?.name || 'N/A'}</td>
                          {columnVisibility.fecha && <td className="p-2 whitespace-nowrap">{new Date(r.fecha).toISOString().split('T')[0]}</td>}
                          {columnVisibility.proceso && (
                            <td className="p-2">
                              {r.procesos && r.procesos.length > 0 ? (
                                r.procesos.map(p => <div key={p._id || p.nombre}>{p.nombre}</div>)
                              ) : (
                                'N/A'
                              )}
                            </td>
                          )}
                          {columnVisibility.maquina && <td className="p-2 whitespace-nowrap">{r.maquina?.nombre || 'N/A'}</td>}
                          {columnVisibility.area && <td className="p-2 whitespace-nowrap">{r.areaProduccion?.nombre || 'N/A'}</td>}
                          {columnVisibility.insumos && (
                            <td className="p-2 whitespace-normal">
                              {r.insumos && r.insumos.length > 0 ? r.insumos.map(i => i.nombre).join(', ') : 'N/A'}
                            </td>
                          )}
                          {columnVisibility.observaciones && <td className="p-2 whitespace-normal text-left">{r.observaciones || ''}</td>}
                          {columnVisibility.tipoTiempo && <td className="p-2">{getTipoTiempoBadge(r.tipoTiempo)}</td>}
                          {columnVisibility.tiempo && <td className="p-2 font-semibold text-green-600 whitespace-nowrap">{r.tiempo} min</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {resultados.length === 0 && !loading && (
                    <p className="mt-4 text-gray-600 text-center">No se encontraron registros con los filtros aplicados.</p>
                  )}
                </div>
              )}
              {totalResults > itemsPerPage && (
                <div className="bg-white p-4 shadow-md rounded-b-lg border-t border-gray-200 mt-2 flex justify-center sticky bottom-0 z-10">
                  <Pagination
                    currentPage={currentPage}
                    totalResults={totalResults}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </Card>            
          </div>
        </div>
      </div>
      {/* Loader CSS */}
      <style>{`
        .loader {
          border: 4px solid #e0e7ef;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AdminDashboard;
