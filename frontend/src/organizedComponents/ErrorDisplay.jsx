// components/ErrorDisplay.jsx
import React from 'react';

const ErrorDisplay = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
      <p className="font-bold">{error.type}</p>
      <p>{error.message}</p>
      {error.details && <p className="text-sm">{error.details}</p>}
    </div>
  );
};

export default ErrorDisplay;