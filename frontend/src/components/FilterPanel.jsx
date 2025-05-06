import React, { useState, useEffect } from "react";
import { Button, Input, Label } from "./ui/index";
import { Calendar } from "./ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { CalendarIcon, ChevronDown, ChevronUp, Download, Search, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../utils/cn";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/Collapsible";
import axiosInstance from "../utils/axiosInstance"; // Importa tu instancia de Axios

const FilterPanel = ({ onBuscar, onExportar }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [filters, setFilters] = useState({
    oti: "",
    operario: "",
    proceso: "",
    areaProduccion: "",
    maquina: "",
    fechaInicio: undefined,
    fechaFin: undefined,
  });
  const [oti, setOti] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [areasProduccionData, setAreasProduccionData] = useState([]);
  const [maquinas, setMaquinas] = useState([]);

  useEffect(() => {
    const cargarDatosColecciones = async () => {
      try {
        const otiResponse = await axiosInstance.get('produccion/oti');
        setOti(otiResponse.data);

        const operariosResponse = await axiosInstance.get('produccion/operarios');
        setOperarios(operariosResponse.data);

        const procesosResponse = await axiosInstance.get('produccion/procesos');
        setProcesos(procesosResponse.data);

        const areasResponse = await axiosInstance.get('produccion/areas');
        setAreasProduccionData(areasResponse.data);

        const maquinasResponse = await axiosInstance.get('produccion/maquinas');
        setMaquinas(maquinasResponse.data);

      } catch (error) {
        console.error("Error al cargar los datos de las colecciones para el filtro:", error);
        // Puedes mostrar un mensaje de error al usuario si lo deseas
      }
    };

    cargarDatosColecciones();
  }, []);

  const handleApplyFilters = () => {
    onBuscar(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      oti: "",
      operario: "",
      proceso: "",
      areaProduccion: "",
      maquina: "",
      fechaInicio: undefined,
      fechaFin: undefined,
    });
    onBuscar({});
    console.log('🔍 handleClearFilters ejecutado en FilterPanel');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  return (
    <Card className="mb-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="xs" className="w-7 p-0">
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent className="p-0">
          <CardContent className="grid gap-4 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 xl:grid-cols-7 gap-4">
              <div key="oti" className="space-y-1">
                <Label htmlFor="oti">OTI</Label>
                <Input as="select" id="oti" name="oti" value={filters.oti} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Todas las OTI</option>
                  {oti.map((otiItem) => (
                    <option key={otiItem._id} value={otiItem._id}>{otiItem.numeroOti}</option>
                  ))}
                </Input>
              </div>
              <div key="operario" className="space-y-1">
                <Label htmlFor="operario">Operario</Label>
                <Input as="select" id="operario" name="operario" value={filters.operario} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Todos los operarios</option>
                  {operarios.map((operario) => (
                    <option key={operario._id} value={operario._id}>{operario.name}</option>
                  ))}
                </Input>
              </div>
              <div key="proceso" className="space-y-1">
                <Label htmlFor="proceso">Proceso</Label>
                <Input as="select" id="proceso" name="proceso" value={filters.proceso} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Todos los procesos</option>
                  {procesos.map((proceso) => (
                    <option key={proceso._id} value={proceso._id}>{proceso.nombre}</option>
                  ))}
                </Input>
              </div>
              <div key="areaProduccion" className="space-y-1">
                <Label htmlFor="areaProduccion">Área Producción</Label>
                <Input as="select" id="areaProduccion" name="areaProduccion" value={filters.areaProduccion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Todas las áreas</option>
                  {areasProduccionData.map((area) => (
                    <option key={area._id} value={area._id}>{area.nombre}</option>
                  ))}
                </Input>
              </div>
              <div key="maquina" className="space-y-1">
                <Label htmlFor="maquina">Máquina</Label>
                <Input as="select" id="maquina" name="maquina" value={filters.maquina} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Todas las máquinas</option>
                  {maquinas.map((maquina) => (
                    <option key={maquina._id} value={maquina._id}>{maquina.nombre}</option>
                  ))}
                </Input>
              </div>

              <div className="space-y-1">
                <Label>Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.fechaInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.fechaInicio ? format(filters.fechaInicio, "d MMM yyyy", { locale: es }) : <span>Seleccione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-100">
                    <Calendar
                      mode="single"
                      selected={filters.fechaInicio}
                      onSelect={(date) => setFilters({ ...filters, fechaInicio: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label>Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.fechaFin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.fechaFin ? format(filters.fechaFin, "d MMM yyyy", { locale: es }) : <span>Seleccione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-100">
                    <Calendar
                      mode="single"
                      selected={filters.fechaFin}
                      onSelect={(date) => setFilters({ ...filters, fechaFin: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 border-t px-4 py-2">
            <Button variant="outline" onClick={handleClearFilters} className="text-xs h-8 px-3 flex items-center gap-1">
              <X className="mr-2 h-4 w-4" /> Limpiar Filtros
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="text-xs h-8 px-3 flex items-center gap-1">
                <Search className="mr-2 h-4 w-4" /> Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={onExportar} className="text-xs h-8 px-3 flex items-center gap-1">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default FilterPanel;