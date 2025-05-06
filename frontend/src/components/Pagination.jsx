// ✅ Pagination.jsx
import React from 'react';

const Pagination = ({ currentPage, totalResults, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  console.log('Pagination Component - totalResults:', totalResults, 'totalPages:', totalPages, 'currentPage:', currentPage);
  console.log('🔍 Rendering Pagination - currentPage:', currentPage, 'totalPages:', totalPages, 'totalResults:', totalResults);

  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 mr-2 rounded bg-gray-200 hover:bg-gray-300 disabled:text-gray-500"
      >
        Anterior
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-3 py-2 rounded ${
            currentPage === number ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          } mr-1`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-3 py-2 ml-2 rounded bg-gray-200 hover:bg-gray-300 disabled:text-gray-500"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;