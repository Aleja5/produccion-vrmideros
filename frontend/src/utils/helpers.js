/**
 * Formatea una cadena de fecha ISO a una hora local.
 * @param {string} isoDateString - La cadena de fecha ISO (ej. "2025-05-30T15:00:00.000Z").
 * @returns {string} La hora formateada (ej. "03:00 PM").
 */
export const formatTime = (isoDateString) => {
    if (!isoDateString) return '--:--';
    return new Date(isoDateString).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Retorna las clases de Tailwind CSS para el color de fondo y texto de un estado.
 * @param {string} estado - El estado de la actividad (ej. "Finalizado", "En progreso").
 * @returns {string} Clases de Tailwind CSS.
 */
export const getStateColors = (estado) => {
    switch (estado?.toLowerCase()) {
        case 'finalizado': return 'bg-green-100 text-green-700';
        case 'en progreso': return 'bg-blue-100 text-blue-700';
        case 'pendiente': return 'bg-yellow-100 text-yellow-700';
        case 'pausado': return 'bg-orange-100 text-orange-700';
        case 'cancelado': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
};

/**
 * Formatea una cadena de fecha ISO a un formato de fecha local legible.
 * @param {string} isoDateString - La cadena de fecha ISO.
 * @returns {string} La fecha formateada (ej. "miércoles, 21 de mayo de 2025").
 */
export const getFormattedLocalDateDisplay = (isoDateString) => {
    if (!isoDateString) return 'N/A';
    const date = new Date(isoDateString);
    return date.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * Extrae la parte YYYY-MM-DD de una cadena de fecha ISO en UTC para comparación de fechas.
 * @param {string} fecha - La cadena de fecha ISO.
 * @returns {string} La fecha en formato YYYY-MM-DD.
 */
export const getFechaISOForComparison = (fecha) => {
    const date = new Date(fecha);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};