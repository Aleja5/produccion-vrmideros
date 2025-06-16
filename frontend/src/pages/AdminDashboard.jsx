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
  };    const handleBuscar = async (filtrosRecibidos) => {
        setLoading(true);
        setError(null);
        setCurrentPage(1); 
        setCurrentFilters(filtrosRecibidos);

        try {
            const filtrosAjustados = { ...filtrosRecibidos };
            
            // Manejo correcto de fechas para evitar problemas de zona horaria
            if (filtrosRecibidos.fechaInicio) {
                const date = new Date(filtrosRecibidos.fechaInicio);
                // Usar formato YYYY-MM-DD para evitar conversión de zona horaria
                const fechaLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                filtrosAjustados.fechaInicio = fechaLocal;
                console.log('🗓️ Fecha inicio procesada:', {
                    original: filtrosRecibidos.fechaInicio,
                    procesada: fechaLocal,
                    local: date.toLocaleDateString()
                });
            }
            if (filtrosRecibidos.fechaFin) {
                const date = new Date(filtrosRecibidos.fechaFin);
                // Usar formato YYYY-MM-DD para evitar conversión de zona horaria
                const fechaLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                filtrosAjustados.fechaFin = fechaLocal;
                console.log('🗓️ Fecha fin procesada:', {
                    original: filtrosRecibidos.fechaFin,
                    procesada: fechaLocal,
                    local: date.toLocaleDateString()
                });
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
      let response;      if (currentFilters && Object.keys(currentFilters).length > 0) {
        // Fetch filtered data
        const filtrosAjustados = { ...currentFilters };
        
        // Manejo correcto de fechas para evitar problemas de zona horaria
        if (currentFilters.fechaInicio) {
            const date = new Date(currentFilters.fechaInicio);
            const fechaLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            filtrosAjustados.fechaInicio = fechaLocal;
        }
        if (currentFilters.fechaFin) {
            const date = new Date(currentFilters.fechaFin);
            const fechaLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            filtrosAjustados.fechaFin = fechaLocal;
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
      let allResults = [];      if (currentFilters && Object.keys(currentFilters).length > 0) {
        // Si hay filtros, pedir todos los resultados filtrados (sin paginación)
        const filtrosAjustados = { ...currentFilters };
          // Manejo correcto de fechas para evitar problemas de zona horaria
        if (currentFilters.fechaInicio) {
          const date = new Date(currentFilters.fechaInicio);
          const fechaLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          filtrosAjustados.fechaInicio = fechaLocal;
        }
        if (currentFilters.fechaFin) {
          const date = new Date(currentFilters.fechaFin);
          const fechaLocal = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          filtrosAjustados.fechaFin = fechaLocal;
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
      }      const rows = allResults.map((r) => ({
        Fecha: new Date(r.fecha).toISOString().split('T')[0],
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
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"> {/* Changed min-h-screen to h-screen */}
        
        <div className="flex bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 h-screen">
          <SidebarAdmin />
        </div>

        {/* Contenido principal con scroll y ancho flexible */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="container mx-auto px-4 py-8 flex flex-col flex-grow overflow-hidden">
            {/* Encabezado */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2 flex-shrink-0">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Consultas de Producción</h1>
                <p className="text-lg text-gray-500 mt-2">Panel de consulta y exportación de registros de producción</p> {/* Slightly darker text */}
              </div>
              <div className="flex gap-3 mt-2 md:mt-0"> {/* Increased gap */}
                {/* Styled Exportar Excel button */}
                <button
                  onClick={exportarExcel}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-down"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m15 15-3 3-3-3"/></svg>
                  Exportar Excel
                </button>
              </div>
            </div>

            {/* Filtros */}
            {/* Updated Card styling */}
            <Card className="mb-4 p-3 bg-white shadow-lg rounded-lg"> {/* Removed flex-shrink-0 */}
              <FilterPanel onBuscar={handleBuscar} onExportar={exportarExcel} />
            </Card>

            {/* Resultados */}
            {/* Updated Card styling */}
            <Card className="mb-8 p-4 bg-white shadow-xl rounded-2xl flex flex-col flex-grow overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3 flex-shrink-0"> {/* Increased mb and gap */}
                <h2 className="text-2xl font-bold text-blue-700">Resultados</h2> {/* Increased text size */}
                <div className="flex items-center gap-4"> {/* Grouped button and total */}
                  <div className="relative inline-block text-left">
                    {/* Styled Configurar Columnas button */}
                    <Button
                      onClick={() => setIsColumnDropdownOpen(prev => !prev)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-lg shadow-sm hover:shadow transition duration-150 ease-in-out flex items-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                      Columnas
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
                                className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0" // Added focus:ring-offset-0
                              />
                              {col.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg">
              {loading ? (
                <div className="flex justify-center items-center h-full"> {/* Increased py */}
                  <span className="loader border-blue-500"></span>
                  <span className="ml-3 text-blue-600 text-lg">Cargando registros...</span> {/* Increased ml and text size */}
                </div>              
              ) : (
                <>
                  {resultados.length > 0 ? (
                    <table className="w-full bg-white text-sm">{/* Removed rounded from table itself, ensured no space before thead */}
                      <thead className="bg-gray-100 sticky top-0 z-10">{/* Darker gray for header, ensured no space before tr */}
                        <tr>
                          {/* Adjusted padding, text alignment, and font style for th */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">OTI</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Operario</th>
                          {columnVisibility.fecha && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>}
                          {columnVisibility.proceso && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Proceso</th>}
                          {columnVisibility.maquina && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Máquina</th>}
                          {columnVisibility.area && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Área</th>}
                          {columnVisibility.insumos && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Insumos</th>}
                          {columnVisibility.observaciones && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Observaciones</th>}
                          {columnVisibility.tipoTiempo && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tipo de Tiempo</th>}
                          {columnVisibility.tiempo && <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tiempo (min)</th>}
                        </tr>
                      </thead>{/* Ensured no space after thead */}
                      <tbody className="bg-white divide-y divide-gray-200">{/* Ensured no space before tr */}
                        {resultados.map((r, idx) => (
                          <tr
                            key={r._id}
                            className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}
                          >{/* Ensured no space before td */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.oti?.numeroOti || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.operario?.name || 'N/A'}</td>
                            {columnVisibility.fecha ? <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(r.fecha).toISOString().split('T')[0]}</td> : null}
                            {columnVisibility.proceso ? (
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {r.procesos && r.procesos.length > 0 ? (
                                  r.procesos.map(p => <div key={p._id || p.nombre}>{p.nombre}</div>)
                                ) : (
                                  'N/A'
                                )}
                              </td>
                            ) : null}
                            {columnVisibility.maquina ? <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.maquina?.nombre || 'N/A'}</td> : null}
                            {columnVisibility.area ? <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.areaProduccion?.nombre || 'N/A'}</td> : null}
                            {columnVisibility.insumos ? (
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs whitespace-normal break-words">
                                {r.insumos && r.insumos.length > 0 ? r.insumos.map(i => i.nombre).join(', ') : 'N/A'}
                              </td>
                            ) : null}
                            {columnVisibility.observaciones ? <td className="px-6 py-4 text-sm text-gray-700 whitespace-normal text-left max-w-md break-words">{r.observaciones || ''}</td> : null}
                            {columnVisibility.tipoTiempo ? <td className="px-6 py-4 text-sm text-gray-700 text-center">{getTipoTiempoBadge(r.tipoTiempo)}</td> : null}
                            {columnVisibility.tiempo ? <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{r.tiempo} min</td> : null}
                          </tr>
                        ))}
                      </tbody>{/* Ensured no space after tbody */}
                    </table>
                  ) : (
                    <div className="flex justify-center items-center h-full"> {/* Wrapper to center "no results" message */}
                      <p className="py-8 text-center text-gray-500">No se encontraron registros con los filtros aplicados.</p>
                    </div>
                  )}
                </>
              )}           
              </div> {/* This closes flex-grow overflow-y-auto... */}

              {totalResults > itemsPerPage && !loading && ( // Added !loading condition here
                // Consistent pagination container style
                <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200 sm:px-6 mt-auto rounded-b-lg flex-shrink-0">
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
          border: 4px solid #e0e7ef; /* Lighter border */
          border-top: 4px solid #3b82f6; /* Blue accent */
          border-radius: 50%;
          width: 32px; /* Slightly smaller */
          height: 32px; /* Slightly smaller */
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
