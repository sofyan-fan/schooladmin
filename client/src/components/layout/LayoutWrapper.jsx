import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const LayoutWrapper = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background-base">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6 bg-background-subtle">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutWrapper;
