import React, { useState } from "react";
import { Button, Input, Label } from "./ui/index";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { CalendarIcon, ChevronDown, ChevronUp, Download, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../utils/cn";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/Collapsible";

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
    searchDate: "", // Nuevo estado para la búsqueda de fechas
  });

  const handleApplyFilters = () => {
    const formattedFilters = {
      ...filters,
      fechaInicio: filters.fechaInicio ? filters.fechaInicio.toISOString() : undefined,
      fechaFin: filters.fechaFin ? filters.fechaFin.toISOString() : undefined,
    };
    onBuscar(formattedFilters);
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
      searchDate: "", // Limpiar también el campo de búsqueda
    });
    onBuscar({});
  };

  const handleSearchDateChange = (e) => {
    const value = e.target.value;
    setFilters({ ...filters, searchDate: value });

    // Intenta analizar la fecha ingresada
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      setFilters({ ...filters, fechaInicio: parsedDate }); // Actualiza la fecha de inicio
    }
  };

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-0">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[
                { id: "oti", label: "OTI" },
                { id: "operario", label: "Operario" },
                { id: "proceso", label: "Proceso" },
                { id: "areaProduccion", label: "Área Producción" },
                { id: "maquina", label: "Máquina" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    value={filters[id]}
                    onChange={(e) => setFilters({ ...filters, [id]: e.target.value })}
                    placeholder={`Buscar por ${label.toLowerCase()}...`}
                  />
                </div>
              ))}

              {/* Calendarios para fecha de inicio y fin */}
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  name="fechaInicio"
                  value={filters.fechaInicio ? filters.fechaInicio.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    setFilters({ ...filters, fechaInicio: date });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  name="fechaFin"
                  value={filters.fechaFin ? filters.fechaFin.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    setFilters({ ...filters, fechaFin: date });
                  }}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" /> Limpiar Filtros
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>
                <Search className="mr-2 h-4 w-4" /> Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={onExportar}>
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
