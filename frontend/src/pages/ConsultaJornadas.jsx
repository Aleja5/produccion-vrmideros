import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../utils/axiosInstance';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import { Button, Card } from '../components/ui';
import DetalleJornadaModal from '../components/DetalleJornadaModal';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { REFRESH_CONFIG } from '../utils/refreshConfig';

// Helper function to parse date strings as local dates at midnight
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  // Assuming dateString is in 'YYYY-MM-DD' format from input type="date"
  // or a full ISO string from the backend that needs to be treated as local
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day); // Month is 0-indexed
};

const ConsultaJornadas = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(true); // Combined loading state for this page
  const [jornadaSearch, setJornadaSearch] = useState("");
  const [jornadaFechaInicio, setJornadaFechaInicio] = useState("");
  const [jornadaFechaFin, setJornadaFechaFin] = useState("");  const [selectedJornadaId, setSelectedJornadaId] = useState(null);
  const [jornadasTablePage, setJornadasTablePage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);  const jornadasTableItemsPerPage = 5; // Or your preferred number
  
  const fetchJornadas = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      // Add cache-busting parameter
      const timestamp = Date.now();      const response = await axiosInstance.get(`/jornadas?t=${timestamp}`);
      setJornadas(response.data);
      setLastUpdated(new Date());
      console.log('🔄 Jornadas actualizadas:', response.data.length);
    } catch (error) {
      console.error('Error al cargar jornadas:', error);
      if (showLoadingSpinner) {
        toast.error('No se pudieron cargar las jornadas. Intenta de nuevo más tarde.');
      }
      setJornadas([]); // Ensure jornadas is an array on error
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }, []);  useEffect(() => {
    // Initial load
    fetchJornadas();
  }, [fetchJornadas]);

  // Setup auto-refresh using custom hook
  useAutoRefresh(() => {
    fetchJornadas(false); // Don't show loading spinner for auto-refresh
  }, REFRESH_CONFIG.PAGES.CONSULTA_JORNADAS);

  const exportarJornadasExcel = () => {
    const jornadasFiltradasParaExportar = jornadas
      .filter(j => {
        const tieneRegistros = j.registros && j.registros.length > 0;
        const coincideBusquedaOperario = !jornadaSearch || (j.operario?.name || "").toLowerCase().includes(jornadaSearch.toLowerCase());

        let coincideRangoFechas = true;
        const fechaJornada = parseLocalDate(j.fecha);

        if (jornadaFechaInicio) {
          const fechaInicioFiltro = parseLocalDate(jornadaFechaInicio);
          if (fechaJornada && fechaInicioFiltro && fechaJornada < fechaInicioFiltro) {
            coincideRangoFechas = false;
          }
        }
        if (coincideRangoFechas && jornadaFechaFin) {
          const fechaFinFiltro = parseLocalDate(jornadaFechaFin);
          if (fechaJornada && fechaFinFiltro && fechaJornada > fechaFinFiltro) {
            coincideRangoFechas = false;
          }
        }
        return tieneRegistros && coincideBusquedaOperario && coincideRangoFechas;
      })
      .sort((a, b) => {
        const dateA = parseLocalDate(a.fecha) || new Date(0); // Fallback for invalid dates
        const dateB = parseLocalDate(b.fecha) || new Date(0); // Fallback for invalid dates
        return dateB - dateA;
      });

    if (jornadasFiltradasParaExportar.length === 0) {
      toast.info('No hay jornadas para exportar con los filtros aplicados.');
      return;
    }

    const datosParaExcel = jornadasFiltradasParaExportar.map(j => {
      const fechaJornada = parseLocalDate(j.fecha);
      return {
        'Fecha': fechaJornada ? fechaJornada.toLocaleDateString() : 'N/A',
        'Operario': j.operario?.name || 'N/A',
        'N.º Actividades': j.registros?.length || 0,
        'Hora Inicio': j.horaInicio ? new Date(j.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        'Hora Fin': j.horaFin ? new Date(j.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        'Tiempo Total': `${j.totalTiempoActividades?.horas ?? 0}h ${j.totalTiempoActividades?.minutos ?? 0}m`,
      };
    });

    try {
      const ws = XLSX.utils.json_to_sheet(datosParaExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jornadas');
      XLSX.writeFile(wb, 'jornadas_exportadas.xlsx');
      toast.success('Jornadas exportadas a Excel exitosamente.');
    } catch (error) {
      console.error("Error al exportar jornadas a Excel:", error);
      toast.error('Error al exportar jornadas a Excel. Intente de nuevo.');
    }
  };

  const handleJornadasPageChange = (newPage) => {
    setJornadasTablePage(newPage);
  };

  const filteredJornadas = jornadas
    .filter(j => {
      const tieneRegistros = j.registros && j.registros.length > 0;
      const coincideBusquedaOperario = !jornadaSearch || (j.operario?.name || "").toLowerCase().includes(jornadaSearch.toLowerCase());
      
      let coincideRangoFechas = true;
      const fechaJornada = parseLocalDate(j.fecha);

      if (jornadaFechaInicio) {
        const fechaInicioFiltro = parseLocalDate(jornadaFechaInicio);
        if (fechaJornada && fechaInicioFiltro && fechaJornada < fechaInicioFiltro) {
          coincideRangoFechas = false;
        }
      }
      if (coincideRangoFechas && jornadaFechaFin) {
        const fechaFinFiltro = parseLocalDate(jornadaFechaFin);
        if (fechaJornada && fechaFinFiltro && fechaJornada > fechaFinFiltro) {
          coincideRangoFechas = false;
        }
      }
      return tieneRegistros && coincideBusquedaOperario && coincideRangoFechas;
    })
    .sort((a, b) => {
      const dateA = parseLocalDate(a.fecha) || new Date(0);
      const dateB = parseLocalDate(b.fecha) || new Date(0);
      return dateB - dateA; // Sort by most recent date
    });

  const indexOfLastJornada = jornadasTablePage * jornadasTableItemsPerPage;
  const indexOfFirstJornada = indexOfLastJornada - jornadasTableItemsPerPage;
  const currentJornadas = filteredJornadas.slice(indexOfFirstJornada, indexOfLastJornada);
  const totalFilteredJornadas = filteredJornadas.length;

  return (
    <>    
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 h-screen">
          <SidebarAdmin />
        </div>
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Consulta de Jornadas</h1>
                <p className="text-base md:text-lg text-gray-500 mt-1">Visualiza, filtra y exporta las jornadas registradas.</p>
            </div>
            <Card className="p-4 shadow-lg border border-gray-100">              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-gray-700">Jornadas Registradas</h2>
                  {lastUpdated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Última actualización: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchJornadas(true)} 
                    className="shadow-sm self-start sm:self-center text-sm px-3 py-2"
                    disabled={loading}
                  >
                    {loading ? '🔄' : '↻'} Actualizar
                  </Button>
                  <Button variant="outline" onClick={exportarJornadasExcel} className="shadow-sm self-start sm:self-center">
                    Exportar Jornadas a Excel
                  </Button>
                </div>
              </div>
              {/* Filtros rápidos */}
              <div className="flex flex-col md:flex-row gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Buscar por operario..."
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={jornadaSearch}
                  onChange={e => {
                    setJornadaSearch(e.target.value);
                    setJornadasTablePage(1); // Reset page on filter change
                  }}
                />
                <input
                  type="date"
                  placeholder="Fecha Inicio"
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={jornadaFechaInicio}
                  onChange={e => {
                    setJornadaFechaInicio(e.target.value);
                    setJornadasTablePage(1); // Reset page on filter change
                  }}
                  title="Fecha de inicio"
                />
                <input
                  type="date"
                  placeholder="Fecha Fin"
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={jornadaFechaFin}
                  onChange={e => {
                    setJornadaFechaFin(e.target.value);
                    setJornadasTablePage(1); // Reset page on filter change
                  }}
                  title="Fecha de fin"
                />
              </div>
              
              {loading && currentJornadas.length === 0 ? (
                 <div className="flex justify-center items-center py-8">
                    <span className="loader border-gray-500"></span>
                    <span className="ml-2 text-gray-500">Cargando jornadas...</span>
                </div>
              ) : !loading && currentJornadas.length === 0 ? (
                <p className="text-center py-4 text-gray-600">No se encontraron jornadas con los filtros aplicados o no hay jornadas con actividades registradas.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full bg-white rounded text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 font-semibold text-gray-800 text-left">Fecha</th>
                        <th className="p-3 font-semibold text-gray-800 text-left">Operario</th>
                        <th className="p-3 font-semibold text-gray-800 text-center">N.º Actividades</th>
                        <th className="p-3 font-semibold text-gray-800 text-left">Hora Inicio - Hora Fin</th>
                        <th className="p-3 font-semibold text-gray-800 text-left">Tiempo Total</th>
                        <th className="p-3 font-semibold text-gray-800 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentJornadas.map((j, idx) => (
                        <tr key={j._id} className={`border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                          <td className="p-3 whitespace-nowrap">
                            {parseLocalDate(j.fecha)?.toLocaleDateString() || 'N/A'}
                          </td>
                          <td className="p-3 whitespace-nowrap">{j.operario?.name || 'N/A'}</td>
                          <td className="p-3 whitespace-nowrap text-center">{j.registros?.length || 0}</td>
                          <td className="p-3 whitespace-nowrap">
                            {j.horaInicio && j.horaFin ? (
                              (new Date(j.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })) +
                              ' - ' +
                              (new Date(j.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
                            ) : 'N/A'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {`${j.totalTiempoActividades?.horas ?? 0}h ${j.totalTiempoActividades?.minutos ?? 0}m`}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">
                            <Button
                              onClick={() => navigate(`/admin/jornada/${j._id}`)}                                                          
                              className="text-indigo-600 hover:text-indigo-900 font-semibold px-3 py-1 rounded transition-colors bg-indigo-50 hover:bg-indigo-100"
                            >
                              Ver Detalles
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalFilteredJornadas > jornadasTableItemsPerPage && !loading && (
                <div className="bg-white p-4 shadow-md rounded-b-lg border-t border-gray-200 mt-2 flex justify-center sticky bottom-0 z-10">
                  <Pagination
                    currentPage={jornadasTablePage}
                    totalResults={totalFilteredJornadas}
                    itemsPerPage={jornadasTableItemsPerPage}
                    onPageChange={handleJornadasPageChange}
                  />
                </div>
              )}

              {selectedJornadaId && (
                <DetalleJornadaModal
                  jornadaId={selectedJornadaId}
                  onClose={() => setSelectedJornadaId(null)}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
      <style>{`
        .loader {
          border: 4px solid #e0e7ef; /* light gray */
          border-top: 4px solid #3b82f6; /* blue-500 */
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

export default ConsultaJornadas;
