import React, { useState } from "react";
import { Button, Input, Label } from "./ui/index";
import { Calendar } from "./ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { CalendarIcon, ChevronDown, ChevronUp, Download, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../utils/cn";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/Collapsible";

const FilterPanel = ({ onBuscar, onExportar, onClearFilters }) => {
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
    onBuscar({ page: 1, limit: 10 }); // Solicita todos los resultados al limpiar filtros
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
              {[
                { id: "oti", label: "OTI" },
                { id: "operario", label: "Operario" },
                { id: "proceso", label: "Proceso" },
                { id: "areaProduccion", label: "Área Producción" },
                { id: "maquina", label: "Máquina" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1"> {/* Disposición vertical label-input */}
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    value={filters[id]}
                    onChange={(e) => setFilters({ ...filters, [id]: e.target.value })}
                    placeholder={` ${label.toLowerCase()}...`}
                  />
                </div>
              ))}

              <div className="space-y-1"> {/* Disposición vertical label-datepicker */}
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
                      {filters.fechaInicio ? format(filters.fechaInicio, "PPP") : <span>Seleccione</span>}
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

              <div className="space-y-1"> {/* Disposición vertical label-datepicker */}
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
                      {filters.fechaFin ? format(filters.fechaFin, "PPP") : <span>Seleccione</span>}
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