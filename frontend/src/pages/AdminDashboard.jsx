// ✅ AdminDashboard.jsx optimizado
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FilterPanel from '../components/FilterPanel';
import * as XLSX from 'xlsx';
import axiosInstance from '../utils/axiosInstance';

const AdminDashboard = () => {
  const [resultados, setResultados] = useState([]);
  const [totalHoras, setTotalHoras] = useState(0);

  const calcularTotalHoras = (data) => {
    const total = data.reduce((sum, r) => sum + r.tiempoPreparacion + r.tiempoOperacion, 0);
    setTotalHoras(total);
  };

  const handleBuscar = async (filtrosRecibidos) => {
    try {
      const response = await axiosInstance.get('/produccion/buscar-produccion', {
        params: filtrosRecibidos,
      });

      if (Array.isArray(response.data)) {
        setResultados(response.data);
        calcularTotalHoras(response.data);
      } else {
        setResultados([]);
        alert(response.data.msg || 'Sin resultados');
      }
    } catch (err) {
      console.error("❌ Error al buscar:", err);
    }
  };

  // 🔄 Cargar todas las producciones al iniciar
  useEffect(() => {
    axiosInstance.get('/admin/admin-producciones').then((res) => {
      setResultados(res.data);
      calcularTotalHoras(res.data);
    });
  }, []);

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

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Dashboard Administrativo</h1>
        <FilterPanel onBuscar={handleBuscar} onExportar={exportarExcel} />

        <div className="mt-6">
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
                    <td className="p-2">{new Date(r.fecha).toLocaleDateString()}</td>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
