// utils/verificarYCrear.js

export const crearNuevaEntidad = async (valor, nombreColeccion) => {
    try {
        const bodyData = nombreColeccion === "oti"
            ? { numeroOti: valor.trim() }
            : { nombre: valor.trim() };

        const res = await fetch(`http://localhost:5000/api/crear/${nombreColeccion}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
        });

        if (!res.ok) throw new Error(`Error al crear ${nombreColeccion}: ${res.status} ${res.statusText}`);

        const data = await res.json();
        return data.id || data._id || (data.entidad ? data.entidad._id : null);
    } catch (error) {
        console.error(`❌ Error al crear ${nombreColeccion}:`, error);
        return null;
    }
};

export const verificarYCrear = async (valor, nombreColeccion) => {
    if (!valor?.trim?.()) return null;

    try {
        const queryParam = nombreColeccion === "oti" ? "numeroOti" : "nombre";
        const res = await fetch(
            `http://localhost:5000/api/buscar/${nombreColeccion}?${queryParam}=${encodeURIComponent(valor.trim())}`
        );

        if (res.status === 404) {
            return await crearNuevaEntidad(valor, nombreColeccion);
        }

        if (!res.ok) {
            throw new Error(`Error al buscar ${nombreColeccion}: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const entidad = data.entidad || data;
        const normalizado = valor.trim().toLowerCase();

        const encontrado = Array.isArray(entidad)
            ? entidad.find((item) =>
                String(item.numeroOti || item.nombre).trim().toLowerCase() === normalizado
            )
            : (
                (entidad.numeroOti && entidad.numeroOti.trim().toLowerCase() === normalizado) ||
                (entidad.nombre && entidad.nombre.trim().toLowerCase() === normalizado)
              ) ? entidad : null;

        return encontrado?._id || null;
    } catch (error) {
        console.error(`❌ Error en verificarYCrear(${nombreColeccion}):`, error);
        return null;
    }
};
