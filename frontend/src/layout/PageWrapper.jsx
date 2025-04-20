import React from 'react';

const PageWrapper = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
