import axios from "axios";
export const buscarProduccion = async (filtros) => {
    const params = new URLSearchParams(filtros).toString();
    const res = await axios.get(`http://localhost:5000/api/produccion/buscar-produccion?${params}`);
    return res.data;
};