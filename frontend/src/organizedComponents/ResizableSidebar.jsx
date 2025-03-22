// ResizableSidebar.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

const ResizableSidebar = ({ 
  children, 
  minWidth = 250, 
  maxWidth = 400, 
  defaultWidth = 320 
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  // Mouse down event handler to start resizing
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Mouse move event handler to resize sidebar
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth]);

  // Mouse up event handler to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={sidebarRef}
      className="bg-white border-r border-gray-300 flex flex-col h-screen relative"
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resizer handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-gray-300 cursor-ew-resize hover:bg-purple-500 transition-colors"
        onMouseDown={handleMouseDown}
        style={{ 
          cursor: isResizing ? 'ew-resize' : 'col-resize',
          opacity: isResizing ? 1 : 0.5
        }}
      />
    </div>
  );
};

export default ResizableSidebar