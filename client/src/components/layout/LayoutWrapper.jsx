// src/components/layout/LayoutWrapper.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const LayoutWrapper = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-[#FEFBF3]">
      <Sidebar isOpen={sidebarOpen} />
      {/* 
        HERE IS THE FIX: Added `min-w-0` to this div.
        This prevents the flex item from expanding to the full width of its wide content (the table).
      */}
      <div className="flex-1 flex flex-col min-w-0"> 
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 bg-background-subtle">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutWrapper;