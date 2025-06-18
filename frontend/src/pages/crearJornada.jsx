// src/components/CrearJornadaButton.jsx

import React from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../config/axios';
import { CalendarPlus } from 'lucide-react';
import { Button } from '../components/ui';

const CrearJornadaButton = ({ operarioId, onSuccess }) => {
  const crearNuevaJornada = async () => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const { data } = await axiosInstance.post('/jornadas/crear', {
        operario: operarioId,
        fecha: fechaHoy,
      });

      toast.success('✅ Jornada creada con éxito');
      if (onSuccess) onSuccess(); // Refrescar vista

    } catch (error) {
      const res = error.response;
      if (res?.status === 400 && res.data?.jornadaId) {
        toast.info('ℹ️ Ya existe una jornada para hoy');
      } else {
        console.error(error);
        toast.error('❌ Error al crear la jornada');
      }
    }
  };

  return (
    <Button
      onClick={crearNuevaJornada}
      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow"
    >
      <CalendarPlus size={18} />
      Crear Jornada
    </Button>
  );
};

export default CrearJornadaButton;
