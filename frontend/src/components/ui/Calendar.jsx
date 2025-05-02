import React, { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";

registerLocale("es", es); // Registramos la localización en español

function Calendar({ selectedDate, onChange, className, ...props }) {
  const [date, setDate] = useState(selectedDate || new Date());

  const handleChange = (newDate) => {
    setDate(newDate);
    if (onChange) onChange(newDate);
  };

  return (
    <div className={className}>
      <DatePicker
        selected={date}
        onChange={handleChange}
        locale="es" // Configuramos el idioma español
        dateFormat="dd/MM/yyyy" // Formato de la fecha
        className="w-full p-2 border rounded text-center"
        {...props}
      />
    </div>
  );
}

export default Calendar;
export { Calendar };
