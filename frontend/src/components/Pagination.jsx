import React, { useState, useEffect } from 'react';

const Pagination = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const pagesPerGroup = 5; // Cuántos números de página mostrar a la vez

  // Estado para el inicio del grupo de páginas actual
  const [currentGroupStartPage, setCurrentGroupStartPage] = useState(1);

  // Efecto para ajustar el grupo si currentPage cambia fuera del grupo actual
  useEffect(() => {
    const newGroupStartPage = Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1;
    if (newGroupStartPage !== currentGroupStartPage) {
      setCurrentGroupStartPage(newGroupStartPage);
    }
  }, [currentPage, pagesPerGroup, currentGroupStartPage]);

  const pageNumbers = [];
  if (totalPages > 0) {
    const endPageInGroup = Math.min(currentGroupStartPage + pagesPerGroup - 1, totalPages);
    for (let i = currentGroupStartPage; i <= endPageInGroup; i++) {
      pageNumbers.push(i);
    }
  }

  const goToPreviousGroup = () => {
    const newStartPage = Math.max(1, currentGroupStartPage - pagesPerGroup);
    setCurrentGroupStartPage(newStartPage);
    // Opcionalmente, cambiar a la primera página del nuevo grupo:
    // onPageChange(newStartPage); 
  };

  const goToNextGroup = () => {
    const newStartPage = currentGroupStartPage + pagesPerGroup;
    if (newStartPage <= totalPages) {
      setCurrentGroupStartPage(newStartPage);
      // Opcionalmente, cambiar a la primera página del nuevo grupo:
      // onPageChange(newStartPage);
    }
  };
  
  if (totalPages <= 1) {
    return null; // No mostrar paginación si hay 0 o 1 página
  }

  return (
    <div className="flex justify-center items-center mt-6 space-x-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        Anterior
      </button>

      {currentGroupStartPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === 1
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            1
          </button>
          {currentGroupStartPage > pagesPerGroup && ( // Mostrar ... solo si hay más de un grupo antes
             <button
                onClick={goToPreviousGroup}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
              >
                ...
              </button>
          )}
        </>
      )}

      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-3 py-2 rounded-lg transition-all text-sm ${
            currentPage === number
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {number}
        </button>
      ))}

      {currentGroupStartPage + pagesPerGroup -1 < totalPages && (
        <>
          {currentGroupStartPage + pagesPerGroup <= totalPages && ( // Mostrar ... solo si hay más grupos después
            <button
              onClick={goToNextGroup}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
            >
              ...
            </button>
          )}
           <button
            onClick={() => onPageChange(totalPages)}
            className={`px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === totalPages
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;