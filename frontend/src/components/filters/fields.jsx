

export const filterFields = ({ oti, operarios, procesos, areasProduccion, maquinas }) => [
  {
    name: "oti",
    label: "OTI",
    options: oti,
    keyField: "_id",
    valueField: "numeroOti",
  },
  {
    name: "operario",
    label: "Operario",
    options: operarios,
    keyField: "_id",
    valueField: "name",
  },
  {
    name: "proceso",
    label: "Proceso",
    options: procesos,
    keyField: "_id",
    valueField: "nombre",
  },
  {
    name: "areaProduccion",
    label: "Área Producción",
    options: areasProduccion,
    keyField: "_id",
    valueField: "nombre",
  },
  {
    name: "maquina",
    label: "Máquina",
    options: maquinas,
    keyField: "_id",
    valueField: "nombre",
  },
];
