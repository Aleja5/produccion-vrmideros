import React from 'react';

export const Input = React.forwardRef(
    ({ label, className = "", wrapperClassName = "", as: Component = 'input', ...props }, ref) => (
      <div className={wrapperClassName}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <Component
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
          ref={ref}
          {...props}
        />
      </div>
    )
  );
  
  Input.displayName = 'Input';