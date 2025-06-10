import React, { useState } from "react";
import { Button, Input, Label } from "../ui";
import { Calendar } from "../ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";
import { CalendarIcon, ChevronDown, ChevronUp, Download, Search, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../../utils/cn";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/Collapsible";
import { useFiltrosProduccion } from "./useFiltrosProduccion.jsx";
import { filterFields } from "./fields";



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

  const { oti, operarios, procesos, areasProduccion, maquinas } = useFiltrosProduccion();

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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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
              {filterFields({ oti, operarios, procesos, areasProduccion, maquinas })
              .sort((a, b) => a.order - b.order)
              .map(
                ({ name, label, options, keyField, valueField }) => (
                  <div key={name} className="space-y-1">
                    <Label htmlFor={name}>{label}</Label>
                    <Input
                      as="select"
                      id={name}
                      name={name}
                      value={filters[name]}
                      onChange={handleChange}
                    >
                      <option value="">Todos</option>
                      {options
                      .sort ((a, b) => a[valueField].localeCompare(b[valueField]))
                      .map((item) => (
                        <option key={item[keyField]} value={item[keyField]}>
                          {item[valueField]}
                        </option>
                      ))}
                    </Input>
                  </div>
                )
              )}

              {/* Fechas */}
              {["fechaInicio", "fechaFin"].map((campo) => (
                <div key={campo} className="space-y-1">
                  <Label>{campo === "fechaInicio" ? "Desde" : "Hasta"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters[campo] && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {filters[campo]
                          ? format(filters[campo], "d MMM yyyy", { locale: es })
                          : "Seleccione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-100">
                      <Calendar
                        mode="single"
                        selected={filters[campo]}
                        onSelect={(date) =>
                          setFilters((prev) => ({ ...prev, [campo]: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
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
