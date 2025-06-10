// src/hooks/useFiltrosProduccion.js
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export const useFiltrosProduccion = () => {
  const [oti, setOti] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [areasProduccion, setAreasProduccion] = useState([]);
  const [maquinas, setMaquinas] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [
          { data: otiData },
          { data: operariosData },
          { data: procesosData },
          { data: areasData },
          { data: maquinasData }
        ] = await Promise.all([
          axiosInstance.get("produccion/oti"),
          axiosInstance.get("produccion/operarios"),
          axiosInstance.get("produccion/procesos"),
          axiosInstance.get("produccion/areas"),
          axiosInstance.get("produccion/maquinas")
        ]);
        console.log("OTI Data:", otiData);
        console.log("Operarios Data:", operariosData);

        setOti(otiData);
        setOperarios(operariosData);
        setProcesos(procesosData);
        setAreasProduccion(areasData);
        setMaquinas(maquinasData);
      } catch (error) {
        console.error("Error al cargar datos de filtros:", error);
      }
    };

    cargarDatos();
  }, []);

  return { oti, operarios, procesos, areasProduccion, maquinas };
};
