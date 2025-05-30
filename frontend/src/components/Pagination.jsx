import React from 'react';

const Pagination = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 mr-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        Anterior
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-4 py-2 rounded-lg mr-1 transition-all ${
            currentPage === number
              ? 'bg-indigo-600 text-white font-semibold shadow'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-4 py-2 ml-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;