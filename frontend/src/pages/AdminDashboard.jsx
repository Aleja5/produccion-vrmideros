import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FilterPanel from '../components/FilterPanel';
import * as XLSX from 'xlsx';
import { SidebarAdmin } from '../components/SidebarAdmin';
import axiosInstance from '../utils/axiosInstance';
import Pagination from '../components/Pagination'; // Asegúrate de importar el componente de paginación

const AdminDashboard = () => {
  const [resultados, setResultados] = useState([]);
  const [totalHoras, setTotalHoras] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Define cuántos resultados mostrar por página
  const [totalResults, setTotalResults] = useState(0); // Para saber cuántos resultados totales hay
  const [error, setError] = useState(null);

  const calcularTotalHoras = (data) => {
    if (Array.isArray(data)) {
      const total = data.reduce((sum, r) => sum + r.tiempoPreparacion + r.tiempoOperacion, 0);
      setTotalHoras(total);
    } else {
      setTotalHoras(0);
    }
  };

  const handleBuscar = async (filtrosRecibidos) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reinicia a la primera página al buscar

    try {
      const filtrosAjustados = { ...filtrosRecibidos };
      if (filtrosRecibidos.fechaInicio) {
        filtrosAjustados.fechaInicio = new Date(filtrosRecibidos.fechaInicio).toISOString();
      }
      if (filtrosRecibidos.fechaFin) {
        filtrosAjustados.fechaFin = new Date(filtrosRecibidos.fechaFin).toISOString();
      }

      const response = await axiosInstance.get('/produccion/buscar-produccion', {
        params: {
          ...filtrosAjustados,
          page: 1, // Siempre comienza desde la primera página
          limit: itemsPerPage,
        },
      });

      if (response.data.resultados && Array.isArray(response.data.resultados)) {
        setResultados(response.data.resultados);
        calcularTotalHoras(response.data.resultados);
        setTotalResults(response.data.totalResults || response.data.totalResultados || 0);
      } else {
        setResultados([]);
        setTotalHoras(0);
        setTotalResults(0); // Asegúrate de que la paginación no desaparezca
      }
    } catch (err) {
      console.error("❌ Error al buscar:", err);
      setError('Error al buscar los registros.');
      setResultados([]);
      setTotalHoras(0);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to the first page

    try {
      const response = await axiosInstance.get('/admin/admin-producciones', {
        params: {
          page: 1, // Fetch the first page of results
          limit: itemsPerPage,
        },
      });

      if (response.data.resultados && Array.isArray(response.data.resultados)) {
        setResultados(response.data.resultados);
        calcularTotalHoras(response.data.resultados);
        setTotalResults(response.data.totalResults || 0); // Update total results
      } else {
        setResultados([]);
        setTotalHoras(0);
        setTotalResults(0);
      }
    } catch (err) {
      console.error("Error al limpiar filtros:", err);
      setError('Error al limpiar los filtros.');
      setResultados([]);
      setTotalHoras(0);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Cargar todas las producciones al iniciar
  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/admin/admin-producciones', {
      params: {
        page: currentPage,
        limit: itemsPerPage,
      },
    }).then((res) => {
      console.log('AdminDashboard - Backend Response:', res.data);
      if (res.data?.resultados && Array.isArray(res.data.resultados)) {
        setResultados(res.data.resultados);
        calcularTotalHoras(res.data.resultados);
        console.log('AdminDashboard - Setting totalResults:', res.data.totalResults);
        setTotalResults(res.data.totalResultados || 0);
      } else {
        setResultados([]);
        setTotalResults(0);
        if (res.data?.msg) {
          alert(res.data.msg);
        }
      }
      setLoading(false);
    }).catch((err) => {
      console.error("❌ Error al cargar producciones iniciales:", err);
      setError('Error al cargar las producciones iniciales.');
      setLoading(false);
    });
  }, [currentPage, itemsPerPage]);

  const exportarExcel = () => {
    const rows = resultados.map((r) => ({
      OTI: r.oti?.numeroOti || '',
      Operario: r.operario?.name || '',
      Fecha: new Date(r.fecha).toLocaleDateString(),
      Proceso: r.proceso?.nombre || '',
      Maquina: r.maquina?.nombre || '',
      Area: r.areaProduccion?.nombre || '',
      Preparación: r.tiempoPreparacion,
      Operación: r.tiempoOperacion,
      Total: r.tiempoPreparacion + r.tiempoOperacion,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Producción');
    XLSX.writeFile(wb, 'produccion.xlsx');
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <>
      <Navbar />
      <div className="flex bg-gray-100 h-screen">
        <SidebarAdmin />

        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-xl font-bold mb-2">Consultas Produccion</h1>
            <FilterPanel onBuscar={handleBuscar} onExportar={exportarExcel} onClearFilters={handleClearFilters} />

            <div className="flex flex-col h-full"> {/* Contenedor principal */}
              <div className="flex-1 overflow-y-auto"> {/* Contenedor scrollable para resultados */}
                <h2 className="text-xl font-bold mb-2">Resultados</h2>
                <p className="mb-4">Total de minutos trabajados: <span className="font-semibold text-blue-600">{totalHoras}</span></p>

                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded shadow text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2">OTI</th>
                        <th className="p-2">Operario</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Proceso</th>
                        <th className="p-2">Máquina</th>
                        <th className="p-2">Área</th>
                        <th className="p-2">Prep.</th>
                        <th className="p-2">Oper.</th>
                        <th className="p-2 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r) => (
                        <tr key={r._id} className="text-center border-b hover:bg-gray-50">
                          <td className="p-2">{r.oti?.numeroOti}</td>
                          <td className="p-2">{r.operario?.name}</td>
                          <td className="p-2">{new Date(r.fecha).toISOString().split('T')[0]}</td>
                          <td className="p-2">{r.proceso?.nombre}</td>
                          <td className="p-2">{r.maquina?.nombre}</td>
                          <td className="p-2">{r.areaProduccion?.nombre}</td>
                          <td className="p-2">{r.tiempoPreparacion} min</td>
                          <td className="p-2">{r.tiempoOperacion} min</td>
                          <td className="p-2 font-semibold text-green-600">
                            {r.tiempoPreparacion + r.tiempoOperacion} min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {resultados.length === 0 && !loading && <p className="mt-4 text-gray-600">No se encontraron registros con los filtros aplicados.</p>}
                </div>
              </div>
              {totalResults > 0 && (
                <div className="bg-white p-4 shadow-md sticky bottom-0"> {/* Ajusto el margen y anclo la paginación al final de la vista */}
                  <Pagination
                    currentPage={currentPage}
                    totalResults={totalResults}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
