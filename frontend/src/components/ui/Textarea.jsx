import React from 'react';

export const Textarea = ({ label, className = "", ...props }) => (
  <div className="mb-4 shadow-sm">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      {...props}
    />
  </div>
);
