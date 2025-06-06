import React from 'react';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export const DetalleJornadaModal = ({ jornadaId, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Detalle de Jornada
              </h3>
              
              <div className="mt-4 space-y-4">
                {/* Aquí irá el contenido del detalle */}
                <p className="text-sm text-gray-500">
                  ID de Jornada: {jornadaId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};